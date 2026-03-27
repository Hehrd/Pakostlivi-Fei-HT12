package com.mischievous.fairies.common.exceptions;

import com.mischievous.fairies.common.CustomException;
import org.springframework.http.HttpStatus;

public class JsonDeserializationException extends CustomException {
    public JsonDeserializationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
