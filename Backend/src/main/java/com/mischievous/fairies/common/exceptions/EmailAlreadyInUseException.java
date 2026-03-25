package com.mischievous.fairies.common.exceptions;

import com.mischievous.fairies.common.CustomException;
import org.springframework.http.HttpStatus;

public class EmailAlreadyInUseException extends CustomException {
    public EmailAlreadyInUseException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
