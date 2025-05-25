package com.gl.hive.AuthenticationService.util;

import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.model.entity.VerificationToken;
import com.gl.hive.AuthenticationService.model.entity.jwt.JwtToken;
import com.gl.hive.AuthenticationService.model.entity.jwt.TokenType;
import com.gl.hive.AuthenticationService.model.request.RegisterRequest;
import com.gl.hive.AuthenticationService.repository.VerificationTokenRepository;
import com.gl.hive.AuthenticationService.repository.jwt.JwtTokenRepository;
import com.gl.hive.shared.lib.exceptions.HiveException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * A utility class that provides helper methods for authentication and registration of user.
 * This class contains method for revoking the JWT token, build and saving JWT token, generating verification token.
 */
@SuppressWarnings("unused")
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationUtils {

    private final VerificationTokenRepository verificationTokenRepository;
    private final JwtTokenRepository jwtTokenRepository;

    /**
     * Builds and saves a JWT token for the specified user.
     *
     * @param user  the {@link User User} object for which to generate the JWT token
     * @param token the JWT token to save
     */
    public void buildAndSaveJwtToken(User user, String token) {
        // Build a new JwtToken object with the specified user and token, and save it to the database
        JwtToken jwtToken = JwtToken.builder()
                .expired(false)
                .revoked(false)
                .type(TokenType.BEARER)
                .user(user)
                .token(token)
                .build();
        jwtTokenRepository.save(jwtToken);
    }


    /**
     * Revokes all valid tokens for the specified user by setting their 'expired' and 'revoked' flags to true.
     *
     * @param user the {@link User User} object for which to revoke all tokens
     */
    public void revokeAllUserTokens(User user) {
        // Find all valid tokens for the specified user
        List<JwtToken> validUserTokens = jwtTokenRepository.findAllByUser_UserIdAndExpiredIsFalseAndRevokedIsFalse(user.getUserId());

        // If no valid tokens were found, return without modifying the database
        if (validUserTokens.isEmpty())
            return;

        // Iterate through all valid tokens and set their 'expired' and 'revoked' flags to true
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        jwtTokenRepository.saveAll(validUserTokens);
    }


    /**
     * Generates a verification token for the user that has attempted to sign-up.
     *
     * @param user the user to generate the verification token for
     * @return the verification token as a string
     */
    public String generateVerificationToken(User user) {
        VerificationToken verificationToken = new VerificationToken(user);
        verificationTokenRepository.save(verificationToken);
        return verificationToken.getToken();
    }

    /**
     * Validates a registration request to ensure all required fields are present and in correct format.
     *
     * @param request The register request to validate
     * @throws HiveException if the validation fails
     */
    public void validateRegistrationRequest(RegisterRequest request) {
        log.info("Validating registration request for email: {}", request.getEmail());

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new HiveException("Email is required", HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.value());
        }

        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new HiveException("Username is required", HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.value());
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new HiveException("Password is required", HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.value());
        }

        log.info("Registration request validation passed for email: {}", request.getEmail());
    }
}
