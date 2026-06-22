package com.urdushadikhana.smsgateway

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class GatewayConfig(
    val instanceUrl: String,
    val accessToken: String,
    val apiKey: String,
    val pollIntervalSeconds: Int
)

data class SmsHistoryItem(
    val phoneNumber: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "SENT"
)

object GatewayPreferences {
    private const val PREFS_NAME = "shadikhana_sms_gateway"
    private const val KEY_INSTANCE_URL = "instance_url"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_API_KEY = "api_key"
    private const val KEY_POLL_INTERVAL = "poll_interval"
    private const val KEY_GATEWAY_ENABLED = "gateway_enabled"
    private const val KEY_LAST_POLL = "last_poll"
    private const val KEY_LAST_POLL_ERROR = "last_poll_error"
    private const val KEY_LAST_SENT = "last_sent"
    private const val KEY_TEST_PHONE = "test_phone"
    private const val KEY_SMS_HISTORY = "sms_history"

    private lateinit var appContext: Context
    private val gson = Gson()

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    private fun prefs() = EncryptedSharedPreferences.create(
        appContext,
        PREFS_NAME,
        MasterKey.Builder(appContext).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveConfig(config: GatewayConfig) {
        prefs().edit()
            .putString(KEY_INSTANCE_URL, config.instanceUrl.trim().trimEnd('/'))
            .putString(KEY_ACCESS_TOKEN, config.accessToken.trim())
            .putString(KEY_API_KEY, config.apiKey.trim())
            .putInt(KEY_POLL_INTERVAL, config.pollIntervalSeconds.coerceIn(30, 600))
            .apply()
    }

    fun getConfig(): GatewayConfig? {
        val instanceUrl = prefs().getString(KEY_INSTANCE_URL, null).orEmpty()
        val accessToken = prefs().getString(KEY_ACCESS_TOKEN, null).orEmpty()
        val apiKey = prefs().getString(KEY_API_KEY, null).orEmpty()
        if (instanceUrl.isBlank() || accessToken.isBlank() || apiKey.isBlank()) {
            return null
        }
        return GatewayConfig(
            instanceUrl = instanceUrl,
            accessToken = accessToken,
            apiKey = apiKey,
            pollIntervalSeconds = prefs().getInt(KEY_POLL_INTERVAL, 60).coerceIn(30, 600)
        )
    }

    fun setGatewayEnabled(enabled: Boolean) {
        prefs().edit().putBoolean(KEY_GATEWAY_ENABLED, enabled).apply()
    }

    fun isGatewayEnabled(): Boolean = prefs().getBoolean(KEY_GATEWAY_ENABLED, false)

    fun setLastPoll(label: String) {
        prefs().edit().putString(KEY_LAST_POLL, label).apply()
    }

    fun getLastPoll(): String = prefs().getString(KEY_LAST_POLL, "never").orEmpty()

    fun setLastPollError(message: String?) {
        prefs().edit().putString(KEY_LAST_POLL_ERROR, message).apply()
    }

    fun getLastPollError(): String = prefs().getString(KEY_LAST_POLL_ERROR, "").orEmpty()

    fun setLastSent(label: String) {
        prefs().edit().putString(KEY_LAST_SENT, label).apply()
    }

    fun getLastSent(): String = prefs().getString(KEY_LAST_SENT, "none").orEmpty()

    fun saveTestPhone(phone: String) {
        prefs().edit().putString(KEY_TEST_PHONE, phone.trim()).apply()
    }

    fun getTestPhone(): String = prefs().getString(KEY_TEST_PHONE, "").orEmpty()

    fun addSmsToHistory(phoneNumber: String, message: String) {
        val history = getSmsHistory().toMutableList()
        history.add(0, SmsHistoryItem(phoneNumber, message))
        val limitedHistory = history.take(10)
        val json = gson.toJson(limitedHistory)
        prefs().edit().putString(KEY_SMS_HISTORY, json).apply()
    }

    fun getSmsHistory(): List<SmsHistoryItem> {
        val json = prefs().getString(KEY_SMS_HISTORY, null) ?: return emptyList()
        val type = object : TypeToken<List<SmsHistoryItem>>() {}.type
        return try {
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }
}
