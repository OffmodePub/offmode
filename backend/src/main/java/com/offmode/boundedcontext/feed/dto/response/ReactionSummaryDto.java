package com.offmode.boundedcontext.feed.dto.response;

public record ReactionSummaryDto(String emoji, long count, boolean myReact) {}
