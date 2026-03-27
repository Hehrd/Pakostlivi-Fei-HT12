package com.mischievous.fairies.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    public RestClient fastApiRestClient(RestClient.Builder restClientBuilder,
                                        @Value("${fastapi.base-url}") String fastApiBaseUrl) {
        return restClientBuilder
                .baseUrl(fastApiBaseUrl)
                .build();
    }
}
