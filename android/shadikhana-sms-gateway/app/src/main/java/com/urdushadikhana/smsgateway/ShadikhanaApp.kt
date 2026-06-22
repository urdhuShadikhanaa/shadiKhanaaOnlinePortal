package com.urdushadikhana.smsgateway

import android.app.Application

class ShadikhanaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        GatewayPreferences.init(this)
    }
}
