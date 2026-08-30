package com.campusshare.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI campusShareOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("CampusShare API")
                        .version("2.0.0")
                        .description("Secure campus rental marketplace API with JWT auth, rental state machine and Razorpay payment verification.")
                        .contact(new Contact().name("CampusShare Engineering")))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
