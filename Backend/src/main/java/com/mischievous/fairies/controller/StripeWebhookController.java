package com.mischievous.fairies.controller;

import com.mischievous.fairies.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/stripe/webhook")
public class StripeWebhookController {

    private final StripeService stripeService;

    public StripeWebhookController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping()
    public void handleStripeWebhook(@RequestBody String payload,
                                    @RequestHeader("Stripe-Signature") String sig) throws StripeException {
         stripeService.handleWebhook(payload, sig);
    }
}
