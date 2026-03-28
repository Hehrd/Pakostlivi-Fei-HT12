package com.mischievous.fairies.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TagRequestService {
    private final RestClient fastApiRestClient;

    public TagRequestService(RestClient fastApiRestClient) {
        this.fastApiRestClient = fastApiRestClient;
    }

    public void sendTagsToMicroservice(List<String> tags) {
        Map<String, Object> body = new HashMap<>();
        body.put("tags", tags);

        fastApiRestClient.post()
                .uri("/tag/premade")
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
