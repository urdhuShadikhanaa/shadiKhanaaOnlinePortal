package com.urdushadikhana.smsgateway.service

import com.urdushadikhana.smsgateway.GatewayConfig
import com.urdushadikhana.smsgateway.GatewayPreferences
import com.urdushadikhana.smsgateway.api.AckRequest
import com.urdushadikhana.smsgateway.api.ConnectionDiagnostics
import com.urdushadikhana.smsgateway.api.SalesforceApiFactory
import com.urdushadikhana.smsgateway.sms.SmsSender
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SmsGatewayProcessor {

    suspend fun pollAndSend(context: android.content.Context): String = withContext(Dispatchers.IO) {
        val config = GatewayPreferences.getConfig()
            ?: return@withContext recordError("Missing Salesforce settings")

        try {
            val api = SalesforceApiFactory.create(
                config.instanceUrl,
                config.accessToken,
                config.apiKey
            )
            val sender = SmsSender(context)
            if (!sender.canSendSms()) {
                return@withContext recordError("SMS permission not granted")
            }

            val timestamp = formatTimestamp()
            GatewayPreferences.setLastPoll(timestamp)

            val pending = api.getPending()
            GatewayPreferences.setLastPollError(null)

            if (pending.messages.isEmpty()) {
                return@withContext "No pending SMS ($timestamp)"
            }

            var sentCount = 0
            for (message in pending.messages) {
                if (message.toNumber.isBlank()) {
                    continue
                }
                if (message.body.isBlank()) {
                    api.acknowledge(
                        AckRequest(
                            id = message.id,
                            status = "Failed",
                            errorMessage = "Missing SMS body in Salesforce"
                        )
                    )
                    continue
                }
                try {
                    sender.send(message.toNumber, message.body)
                    api.acknowledge(
                        AckRequest(id = message.id, status = "Sent")
                    )
                    sentCount += 1
                    GatewayPreferences.setLastSent("${message.toNumber} at $timestamp")
                } catch (error: Exception) {
                    api.acknowledge(
                        AckRequest(
                            id = message.id,
                            status = "Failed",
                            errorMessage = error.message
                        )
                    )
                }
            }

            "Sent $sentCount of ${pending.messages.size} SMS"
        } catch (error: Exception) {
            recordError(ConnectionDiagnostics.describe(error))
        }
    }

    suspend fun testConnection(config: GatewayConfig): String = withContext(Dispatchers.IO) {
        try {
            val api = SalesforceApiFactory.create(
                config.instanceUrl,
                config.accessToken,
                config.apiKey
            )
            val pending = api.getPending()
            GatewayPreferences.setLastPollError(null)
            "Connected. Pending SMS: ${pending.messages.size}"
        } catch (error: Exception) {
            val message = ConnectionDiagnostics.describe(error)
            GatewayPreferences.setLastPollError(message)
            "Connection failed: $message"
        }
    }

    private fun recordError(message: String): String {
        GatewayPreferences.setLastPollError(message)
        return message
    }

    private fun formatTimestamp(): String {
        return SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())
    }
}
