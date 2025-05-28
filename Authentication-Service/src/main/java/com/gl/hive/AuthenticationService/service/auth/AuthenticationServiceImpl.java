package com.gl.hive.AuthenticationService.service.auth;

import com.gl.hive.AuthenticationService.config.jwt.JwtService;
import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.model.entity.VerificationToken;
import com.gl.hive.AuthenticationService.model.request.AuthenticationRequest;
import com.gl.hive.AuthenticationService.model.request.RegisterRequest;
import com.gl.hive.AuthenticationService.repository.RolesRepository;
import com.gl.hive.AuthenticationService.repository.UserRepository;
import com.gl.hive.AuthenticationService.repository.VerificationTokenRepository;
import com.gl.hive.AuthenticationService.repository.DepartmentsRepository;
import com.gl.hive.AuthenticationService.model.entity.Departments;
import com.gl.hive.AuthenticationService.util.AuthenticationUtils;
import com.gl.hive.shared.lib.exceptions.AuthenticationFailedException;
import com.gl.hive.shared.lib.exceptions.HiveException;
import com.gl.hive.shared.lib.exceptions.ResourceAlreadyExistsException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.response.AuthenticationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.gl.hive.shared.lib.model.enums.Role.TEAM_MEMBER;
import static org.springframework.http.HttpStatus.*;

/**
 * Authentication implementation: Registration & Login.
 */
@SuppressWarnings("unused")
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationServiceImpl implements AuthenticationService {

    @Value("${account.verification.auth.url}")
    private String ACCOUNT_VERIFICATION_AUTH_URL;

    private final UserRepository userRepository;
    private final RolesRepository rolesRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final ModelMapper modelMapper;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final AuthenticationUtils authenticationUtils;
    private final DepartmentsRepository departmentsRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public AuthenticationResponse registerUser(RegisterRequest registerRequest) {
        log.info("Starting registration process for email: {}", registerRequest.getEmail());

        // Validate the registration request
        authenticationUtils.validateRegistrationRequest(registerRequest);

        // check if user already exists in the database
        Optional<User> foundUser = userRepository.findByEmail(registerRequest.getEmail());

        if (foundUser.isPresent()) {
            log.info("❌ This user already exists! provide unique email. ❌");
            throw new ResourceAlreadyExistsException(
                    "⭕ User with email {" + registerRequest.getEmail() + "} already exists.. provide a unique email ⭕",
                    BAD_REQUEST,
                    BAD_REQUEST.value()
            );
        }

        try {
            // find the TEAM_MEMBER role and assign it to newly created user as default role
            Roles teamMemberRole = rolesRepository.findByRole(TEAM_MEMBER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role with TEAM_MEMBER role was not found", NOT_FOUND, NOT_FOUND.value()));

            // create a new user object and map the properties from the register request
            User user = modelMapper.map(registerRequest, User.class);
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.getRoles().add(teamMemberRole);

            // assign department
            if (registerRequest.getDepartment() != null && !registerRequest.getDepartment().isEmpty()) {
                com.gl.hive.shared.lib.model.enums.Department departmentEnum = com.gl.hive.shared.lib.model.enums.Department.valueOf(registerRequest.getDepartment());
                Departments departmentEntity = departmentsRepository.findByDepartment(departmentEnum)
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found", NOT_FOUND, NOT_FOUND.value()));
                user.getDepartments().add(departmentEntity);
            }

            // save the user object to the database
            User savedUser = userRepository.save(user);
            log.info("✅ User saved to db, attempting to send activation email...");

            // generate a verification token and send an email with the activation link
            String verificationToken = authenticationUtils.generateVerificationToken(user);
            String verificationUrl = ACCOUNT_VERIFICATION_AUTH_URL + "/verify/" + verificationToken;
            String subject = "Hive Account Verification";
            String htmlMessage = "<div style='font-family: Arial, sans-serif; color: #222;'>" +
                    "<h2>Welcome to Hive!</h2>" +
                    "<p>Thank you for registering. Please verify your account by clicking the button below:</p>" +
                    "<a href='" + verificationUrl + "' style='display: inline-block; padding: 10px 20px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px;'>Verify Account</a>" +
                    "<hr style='margin: 30px 0;'>" +
                    "<small>If you did not request this, please ignore this email.</small>" +
                    "</div>";
            sendHtmlEmail(user.getEmail(), subject, htmlMessage);

            log.info("➡️ generating JWT token...");
            // generate and return a JWT token for the newly created user
            String jwtToken = jwtService.generateToken(user);

            // save the generated token
            authenticationUtils.buildAndSaveJwtToken(savedUser, jwtToken);

            log.info("User registration completed successfully for email: {}", registerRequest.getEmail());

            return AuthenticationResponse.builder()
                    .username(user.getUsername())
                    .active(user.isActive())
                    .roles(user.getRoles()
                            .stream().map(roles -> roles.getRole().name())
                            .toList()
                    )
                    .rolesDescription(List.of("➡️➡️Default role for user is TEAM_MEMBER"))
                    .token(jwtToken)
                    .build();
        } catch (Exception e) {
            log.error("Error during user registration: {}", e.getMessage(), e);
            throw new HiveException("Registration failed: " + e.getMessage(),
                    INTERNAL_SERVER_ERROR,
                    INTERNAL_SERVER_ERROR.value());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailService.getMailSender().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailService.getMailSender().send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void verifyAccount(String token) {
        // find the verification token in the database
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Verification token with token {" + token + "} was not found", NOT_FOUND, NOT_FOUND.value()));

        // set the user's active status to true and save the changes to the database
        User user = verificationToken.getUser();
        user.setActive(true);
        userRepository.save(user);

        log.info("✅✅✅ User is now activated. ✅✅✅");
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // Authenticate the user's credentials using the authentication manager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Get the user object from the authentication object and generate a JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found", NOT_FOUND, NOT_FOUND.value()));
        if (!user.isActive()) {
            throw new AuthenticationFailedException(
                "Account not activated. Please verify your email before logging in.",
                UNAUTHORIZED,
                UNAUTHORIZED.value()
            );
        }
        // Log user roles for debugging
        log.info("User '{}' has roles: {}", user.getEmail(), user.getRoles().stream().map(r -> r.getRole().name()).toList());
        String jwtToken = jwtService.generateToken(user);

        // Revoke all the saved tokens for the user and save the generated token
        authenticationUtils.revokeAllUserTokens(user);
        authenticationUtils.buildAndSaveJwtToken(user, jwtToken);

        // Return the authentication response with the JWT token and user information
        return AuthenticationResponse.builder()
                .username(user.getUsername())
                .active(user.isActive())
                .roles(user.getRoles()
                        .stream().map(roles -> roles.getRole().name())
                        .collect(Collectors.toList()))
                .token(jwtToken)
                .build();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Long getCurrentUser() {
        // Step 1: Get the authentication object from the security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Check if the user is authenticated
        if (authentication == null || !authentication.isAuthenticated())
            throw new AuthenticationFailedException("❌❌❌ User is not authenticated! ❌❌❌", UNAUTHORIZED, UNAUTHORIZED.value());

        // Step 2: Get the email of the authenticated user
        String email = authentication.getName();

        // Find the user object in the database using the email
        Optional<User> foundUser = userRepository.findByEmail(email);

        // Check if the user exists in the database
        return foundUser
                .orElseThrow(() ->
                        new ResourceNotFoundException("❌❌❌ User with email: '" + email + "' not found! ❌❌❌", NOT_FOUND, 404)
                ).getUserId();
    }

}
