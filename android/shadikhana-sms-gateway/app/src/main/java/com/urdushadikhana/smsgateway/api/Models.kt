package com.urdushadikhana.smsgateway.api

import com.google.gson.annotations.SerializedName

data class PendingSms(
    val id: String,
    @SerializedName("toNumber")
    val toNumber: String,
    val body: String
)

data class PendingResponse(
    val messages: List<PendingSms> = emptyList()
)

data class AckRequest(
    val id: String,
    val status: String,
    @SerializedName("errorMessage")
    val errorMessage: String? = null
)

data class AckResponse(
    val success: Boolean? = null,
    val error: String? = null
)
