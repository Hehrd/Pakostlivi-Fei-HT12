package com.mischievous.fairies.controller.dtos.response;

import lombok.Data;

import java.util.List;

@Data
public class PagedResponse<T> {
    private List<T> data;
    private int page;
    private int size;
    private long total;
    private long totalPages;
}
