package com.mischievous.fairies.common.exceptions;


import com.mischievous.fairies.common.CustomException;
import org.springframework.http.HttpStatus;

public class InvalidStripeAccountException extends CustomException {
    public InvalidStripeAccountException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
