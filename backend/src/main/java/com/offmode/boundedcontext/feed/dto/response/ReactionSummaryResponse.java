package com.offmode.boundedcontext.feed.dto.response;

public record ReactionSummaryResponse(String emoji, long count, boolean myReact) {}
