package com.gl.hive.CommentService.feign.client;

import com.gl.hive.shared.lib.exceptions.HiveException;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CommentErrorDecoder implements ErrorDecoder {

    @Override
    @SneakyThrows
    public Exception decode(String s, Response response) {
        ObjectMapper objectMapper = new ObjectMapper();

        log.error("❌ url: {{}} ❌", response.request().url());
        log.error("❌ dst: {{}} ❌", s);

        HiveException hiveException = objectMapper.readValue(
                response.body().asInputStream(),
                HiveException.class
        );
        return new HiveException(
                hiveException.getMessage(),
                hiveException.getHttpStatus(),
                response.status()
        );
    }

}
