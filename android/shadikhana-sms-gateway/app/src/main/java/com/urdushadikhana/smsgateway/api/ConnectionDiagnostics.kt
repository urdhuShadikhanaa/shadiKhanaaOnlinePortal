package com.urdushadikhana.smsgateway.api

import retrofit2.HttpException

object ConnectionDiagnostics {
    fun describe(error: Throwable): String {
        if (error is IllegalArgumentException) {
            return error.message ?: "Invalid Salesforce settings"
        }
        if (error is HttpException) {
            val code = error.code()
            val body = error.response()?.errorBody()?.string().orEmpty()
            return when (code) {
                401 -> {
                    if (body.contains("Invalid SMS Gateway API key", ignoreCase = true)) {
                        "HTTP 401: API key mismatch. Copy SMS Gateway API Key from Shadikhana Settings."
                    } else {
                        "HTTP 401: Access token expired or invalid. Run sf org display --verbose and paste a fresh token."
                    }
                }
                403 -> "HTTP 403: User lacks API access. Assign Shadikhana SMS Gateway permission set."
                404 -> "HTTP 404: REST API not found. Check instance URL uses my.salesforce.com."
                else -> "HTTP $code: ${body.ifBlank { error.message() }}"
            }
        }
        return error.message ?: error.javaClass.simpleName
    }
}
