
package com.vidparsepro.desktop

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.chaquo.python.Python
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

data class FormatInfo(
    val format_id: String,
    val ext: String,
    val resolution: String,
    val filesize: Long,
    val url: String
)

data class VideoData(
    val title: String,
    val duration: Int,
    val thumbnail: String,
    val formats: List<FormatInfo>
)

data class ParseResponse(
    val success: Boolean,
    val data: VideoData?,
    val error: String?
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }

    @Composable
    fun MainScreen() {
        var url by remember { mutableStateOf("") }
        var isLoading by remember { mutableStateOf(false) }
        var resultData by remember { mutableStateOf<VideoData?>(null) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        val coroutineScope = rememberCoroutineScope()
        
        var pendingDownload by remember { mutableStateOf<Triple<String, String, String>?>(null) }
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                pendingDownload?.let { (url, title, ext) ->
                    downloadVideo(url, title, ext)
                    pendingDownload = null
                }
            } else {
                Toast.makeText(this@MainActivity, "Storage permission denied", Toast.LENGTH_SHORT).show()
            }
        }
        
        val onDownloadClick: (String, String, String) -> Unit = { url, title, ext ->
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                pendingDownload = Triple(url, title, ext)
                launcher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            } else {
                downloadVideo(url, title, ext)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "VidParse Pro (Local)",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("Video URL") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (url.isBlank()) return@Button
                    isLoading = true
                    errorMessage = null
                    resultData = null

                    coroutineScope.launch {
                        val response = withContext(Dispatchers.IO) {
                            parseVideo(url)
                        }
                        isLoading = false
                        if (response.success && response.data != null) {
                            resultData = response.data
                        } else {
                            errorMessage = response.error ?: "Unknown error"
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Parse Video")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (errorMessage != null) {
                Text(
                    text = "Error: $errorMessage",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            resultData?.let { data ->
                Text(
                    text = data.title,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )

                LazyColumn(modifier = Modifier.fillMaxWidth()) {
                    items(data.formats) { format ->
                        FormatItem(format, data.title, onDownloadClick)
                    }
                }
            }
        }
    }

    @Composable
    fun FormatItem(format: FormatInfo, title: String, onDownloadClick: (String, String, String) -> Unit) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "Resolution: ${format.resolution}")
                    Text(text = "Ext: ${format.ext}", style = MaterialTheme.typography.bodySmall)
                }
                Button(onClick = { onDownloadClick(format.url, title, format.ext) }) {
                    Text("Download")
                }
            }
        }
    }

    private fun parseVideo(url: String): ParseResponse {
        return try {
            val py = Python.getInstance()
            val module = py.getModule("ytdlp_wrapper")
            val resultJson = module.callAttr("extract_info", url).toString()
            Gson().fromJson(resultJson, ParseResponse::class.java)
        } catch (e: Exception) {
            ParseResponse(false, null, e.message)
        }
    }

    private fun downloadVideo(url: String, title: String, ext: String) {
        try {
            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle(title)
                .setDescription("Downloading video...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "${title.replace(Regex("[^a-zA-Z0-9.-]"), "_")}.$ext")
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, "Download started...", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to start download: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
