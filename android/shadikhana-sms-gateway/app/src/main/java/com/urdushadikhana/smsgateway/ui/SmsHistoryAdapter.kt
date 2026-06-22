package com.urdushadikhana.smsgateway.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.urdushadikhana.smsgateway.SmsHistoryItem
import com.urdushadikhana.smsgateway.databinding.ItemSmsHistoryBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SmsHistoryAdapter(private val items: List<SmsHistoryItem>) :
    RecyclerView.Adapter<SmsHistoryAdapter.ViewHolder>() {

    private val dateFormat = SimpleDateFormat("MMM dd, hh:mm a", Locale.getDefault())

    class ViewHolder(val binding: ItemSmsHistoryBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSmsHistoryBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.binding.phoneText.text = item.phoneNumber
        holder.binding.messageText.text = item.message
        holder.binding.dateText.text = dateFormat.format(Date(item.timestamp))
    }

    override fun getItemCount() = items.size
}
