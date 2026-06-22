package com.urdushadikhana.smsgateway.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.urdushadikhana.smsgateway.GatewayPreferences
import com.urdushadikhana.smsgateway.MainActivity
import com.urdushadikhana.smsgateway.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SmsGatewayService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var pollingJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopGateway()
                return START_NOT_STICKY
            }
            else -> startGateway()
        }
        return START_STICKY
    }

    private fun startGateway() {
        GatewayPreferences.setGatewayEnabled(true)
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Starting SMS gateway"))
        pollingJob?.cancel()
        pollingJob = serviceScope.launch {
            while (isActive && GatewayPreferences.isGatewayEnabled()) {
                val result = runCatching {
                    SmsGatewayProcessor.pollAndSend(applicationContext)
                }.getOrElse { error ->
                    "Poll failed: ${error.message}"
                }
                updateNotification(result)
                val intervalSeconds = GatewayPreferences.getConfig()?.pollIntervalSeconds ?: 60
                delay(intervalSeconds * 1000L)
            }
            stopSelf()
        }
    }

    private fun stopGateway() {
        GatewayPreferences.setGatewayEnabled(false)
        pollingJob?.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(content: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.gateway_notification_title))
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_gateway)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(content: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(content))
    }

    private fun createNotificationChannel() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.gateway_notification_title),
            NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        pollingJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "com.urdushadikhana.smsgateway.STOP"
        private const val CHANNEL_ID = "sms_gateway_channel"
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            val intent = Intent(context, SmsGatewayService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, SmsGatewayService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
