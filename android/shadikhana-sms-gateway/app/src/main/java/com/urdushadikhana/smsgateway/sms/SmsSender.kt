package com.urdushadikhana.smsgateway.sms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.urdushadikhana.smsgateway.GatewayPreferences

class SmsSender(private val context: Context) {

    fun canSendSms(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun send(toNumber: String, body: String) {
        if (!canSendSms()) {
            throw SecurityException("SEND_SMS permission not granted")
        }

        val normalized = normalizeIndianNumber(toNumber)
        val smsManager = context.getSystemService(SmsManager::class.java)
        val parts = smsManager.divideMessage(body)
        if (parts.size <= 1) {
            smsManager.sendTextMessage(normalized, null, body, null, null)
        } else {
            smsManager.sendMultipartTextMessage(normalized, null, parts, null, null)
        }
        GatewayPreferences.addSmsToHistory(normalized, body)
    }

    private fun normalizeIndianNumber(raw: String): String {
        val digits = raw.replace(Regex("[^0-9]"), "")
        return when {
            digits.length == 10 -> "+91$digits"
            digits.length == 12 && digits.startsWith("91") -> "+$digits"
            raw.trim().startsWith("+") -> raw.trim()
            else -> "+$digits"
        }
    }
}
