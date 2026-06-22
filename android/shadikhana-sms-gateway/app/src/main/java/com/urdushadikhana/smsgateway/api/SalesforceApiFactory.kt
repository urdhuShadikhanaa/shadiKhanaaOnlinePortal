package com.urdushadikhana.smsgateway.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface SalesforceSmsApi {
    @GET("services/apexrest/shadikhana/sms/v1/pending")
    suspend fun getPending(): PendingResponse

    @POST("services/apexrest/shadikhana/sms/v1/ack")
    suspend fun acknowledge(@Body request: AckRequest): AckResponse
}

object SalesforceApiFactory {
    fun create(instanceUrl: String, accessToken: String, apiKey: String): SalesforceSmsApi {
        val normalizedUrl = normalizeInstanceUrl(instanceUrl)
        val normalizedToken = accessToken.trim()
        val normalizedApiKey = apiKey.trim()

        val authInterceptor = okhttp3.Interceptor { chain ->
            val request = chain.request().newBuilder()
                .header("Authorization", "Bearer $normalizedToken")
                .header("X-Api-Key", normalizedApiKey)
                .header("Accept", "application/json")
                .build()
            chain.proceed(request)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(normalizedUrl))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SalesforceSmsApi::class.java)
    }

    fun normalizeInstanceUrl(url: String): String {
        val trimmed = url.trim().trimEnd('/')
        require(trimmed.isNotBlank()) { "Instance URL is required" }
        if (trimmed.contains("my.site.com", ignoreCase = true)) {
            throw IllegalArgumentException(
                "Use the Salesforce instance URL ending in my.salesforce.com, not the Experience Cloud site URL."
            )
        }
        if (!trimmed.startsWith("https://", ignoreCase = true)) {
            throw IllegalArgumentException("Instance URL must start with https://")
        }
        return trimmed
    }

    private fun ensureTrailingSlash(url: String): String {
        return if (url.endsWith("/")) url else "$url/"
    }
}
