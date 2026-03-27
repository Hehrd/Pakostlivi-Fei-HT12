package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.payment.PaymentDetailsReqDto;
import com.mischievous.fairies.service.StripeService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final StripeService stripeService;
    private final String webhookSecret = "";

    public PaymentController(
            StripeService stripeService
//            @Value("${stripe.webhook-secret}") String webhookSecret
    ) {
        this.stripeService = stripeService;
//        this.webhookSecret = webhookSecret;
    }

    @PostMapping()
    public ResponseEntity<ClientSecretResDto> createPaymentIntent(
            @RequestBody PaymentDetailsReqDto paymentDetails) throws StripeException {
        String clientSecret = stripeService.createPaymentIntent(paymentDetails);
        return ResponseEntity.ok(new ClientSecretResDto(clientSecret));
    }


    @Data
    @AllArgsConstructor
    private static class ClientSecretResDto {
        private String clientSecret;
    }
}