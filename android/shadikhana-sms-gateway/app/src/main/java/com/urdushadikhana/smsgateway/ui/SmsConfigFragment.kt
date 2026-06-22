package com.urdushadikhana.smsgateway.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.urdushadikhana.smsgateway.GatewayConfig
import com.urdushadikhana.smsgateway.GatewayPreferences
import com.urdushadikhana.smsgateway.R
import com.urdushadikhana.smsgateway.api.SalesforceApiFactory
import com.urdushadikhana.smsgateway.databinding.FragmentSmsConfigBinding
import com.urdushadikhana.smsgateway.service.SmsGatewayProcessor
import com.urdushadikhana.smsgateway.service.SmsGatewayService
import com.urdushadikhana.smsgateway.sms.SmsSender
import kotlinx.coroutines.launch

class SmsConfigFragment : Fragment() {

    private var _binding: FragmentSmsConfigBinding? = null
    private val binding get() = _binding!!

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val granted = results[Manifest.permission.SEND_SMS] == true
        if (!granted) {
            toast(getString(R.string.permission_sms_required))
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSmsConfigBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadSettings()
        refreshStatus()

        binding.saveSettingsButton.setOnClickListener {
            saveSettings()
        }
        binding.testConnectionButton.setOnClickListener {
            testConnection()
        }
        binding.sendTestSmsButton.setOnClickListener {
            sendTestSms()
        }
        binding.pollNowButton.setOnClickListener {
            pollNow()
        }
        binding.startGatewayButton.setOnClickListener {
            if (!ensureSmsPermission()) return@setOnClickListener
            if (GatewayPreferences.getConfig() == null) {
                toast("Save Salesforce settings first")
                return@setOnClickListener
            }
            context?.let { ctx -> SmsGatewayService.start(ctx) }
            toast(getString(R.string.gateway_running))
            refreshStatus()
        }
        binding.stopGatewayButton.setOnClickListener {
            context?.let { ctx -> SmsGatewayService.stop(ctx) }
            toast(getString(R.string.gateway_stopped))
            refreshStatus()
        }
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun loadSettings() {
        val config = GatewayPreferences.getConfig()
        binding.instanceUrlInput.setText(
            config?.instanceUrl ?: "https://urdhushadikhanaa-dev-ed.develop.my.salesforce.com"
        )
        binding.accessTokenInput.setText(config?.accessToken.orEmpty())
        binding.apiKeyInput.setText(config?.apiKey.orEmpty())
        binding.pollIntervalInput.setText((config?.pollIntervalSeconds ?: 60).toString())
        binding.testPhoneInput.setText(GatewayPreferences.getTestPhone())
    }

    private fun saveSettings() {
        val config = readConfigFromInputs() ?: return
        val interval = binding.pollIntervalInput.text?.toString()?.toIntOrNull() ?: 60
        GatewayPreferences.saveConfig(config.copy(pollIntervalSeconds = interval))
        GatewayPreferences.saveTestPhone(binding.testPhoneInput.text?.toString().orEmpty())
        toast(getString(R.string.settings_saved))
        refreshStatus()
    }

    private fun testConnection() {
        val config = readConfigFromInputs() ?: return
        GatewayPreferences.saveConfig(config)
        viewLifecycleOwner.lifecycleScope.launch {
            val result = SmsGatewayProcessor.testConnection(config)
            toast(result)
            refreshStatus()
        }
    }

    private fun pollNow() {
        if (!ensureSmsPermission()) return
        val config = readConfigFromInputs() ?: return
        GatewayPreferences.saveConfig(config)
        viewLifecycleOwner.lifecycleScope.launch {
            context?.let { ctx ->
                val result = SmsGatewayProcessor.pollAndSend(ctx)
                toast(result)
                refreshStatus()
            }
        }
    }

    private fun sendTestSms() {
        if (!ensureSmsPermission()) return
        val phone = binding.testPhoneInput.text?.toString().orEmpty()
        if (phone.isBlank()) {
            toast("Enter a test phone number")
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            context?.let { ctx ->
                val result = runCatching {
                    SmsSender(ctx).send(
                        phone,
                        "Urdu Shadikhana SMS gateway test message."
                    )
                    "Test SMS sent to $phone"
                }.getOrElse { error ->
                    "Test SMS failed: ${error.message}"
                }
                toast(result)
            }
        }
    }

    private fun readConfigFromInputs(): GatewayConfig? {
        val interval = binding.pollIntervalInput.text?.toString()?.toIntOrNull() ?: 60
        val config = GatewayConfig(
            instanceUrl = binding.instanceUrlInput.text?.toString().orEmpty(),
            accessToken = binding.accessTokenInput.text?.toString().orEmpty(),
            apiKey = binding.apiKeyInput.text?.toString().orEmpty(),
            pollIntervalSeconds = interval
        )
        if (config.instanceUrl.isBlank() || config.accessToken.isBlank() || config.apiKey.isBlank()) {
            toast("Instance URL, access token, and API key are required")
            return null
        }
        return try {
            config.copy(
                instanceUrl = SalesforceApiFactory.normalizeInstanceUrl(config.instanceUrl),
                pollIntervalSeconds = interval
            )
        } catch (error: IllegalArgumentException) {
            toast(error.message ?: "Invalid instance URL")
            null
        }
    }

    private fun refreshStatus() {
        val running = GatewayPreferences.isGatewayEnabled()
        binding.statusText.text = if (running) "Running" else "Stopped"
        binding.lastPollText.text = "Last poll: ${GatewayPreferences.getLastPoll()}"
        binding.lastSentText.text = "Last SMS: ${GatewayPreferences.getLastSent()}"
        val pollError = GatewayPreferences.getLastPollError()
        if (pollError.isBlank()) {
            binding.lastPollErrorText.visibility = View.GONE
        } else {
            binding.lastPollErrorText.visibility = View.VISIBLE
            binding.lastPollErrorText.text = "Last error: $pollError"
        }
    }

    private fun ensureSmsPermission(): Boolean {
        val ctx = context ?: return false
        val granted = ContextCompat.checkSelfPermission(
            ctx,
            Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            permissionLauncher.launch(arrayOf(Manifest.permission.SEND_SMS))
        }
        return granted
    }

    private fun toast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
