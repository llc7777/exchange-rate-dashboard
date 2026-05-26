package com.leo.exchange.exchange_rate.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SwaggerYamlController {

    @GetMapping(value = "/swagger.yml", produces = "application/yaml")
    public ResponseEntity<String> swaggerYaml() throws IOException {
        ClassPathResource resource = new ClassPathResource("swagger.yml");
        String yaml = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/yaml"))
                .body(yaml);
    }
}
