package expo.modules.wicknative

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * Android implementation of the `WickScreenTime` contract the JS seam expects
 * (see src/native/WickScreenTimeModule.ts). Reads Digital Wellbeing usage totals via
 * [UsageStatsManager], gated by the special PACKAGE_USAGE_STATS access which the user
 * grants in system Settings (there is no runtime permission dialog on Android).
 */
class WickScreenTimeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WickScreenTime")

    // UsageStatsManager exists on every OS level we ship to, so the source is always
    // usable in a build that contains this module; only the permission may be missing.
    Function("isSupported") { true }

    AsyncFunction("getAuthorizationStatus") { authorizationStatus() }

    // Android grants usage access from a Settings screen, not a runtime dialog. We open
    // that screen and return the *current* status; the app re-checks on resume.
    AsyncFunction("requestAuthorization") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
      authorizationStatus()
    }

    AsyncFunction("getTodayMinutes") { foregroundMinutes(startOfDay(0), System.currentTimeMillis()) }

    AsyncFunction("getDailyMinutes") { days: Int ->
      val out = ArrayList<Map<String, Any>>(days)
      val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      // Oldest first, most recent last — matches the JS contract's ordering.
      for (offset in (days - 1) downTo 0) {
        val start = startOfDay(-offset)
        val end = startOfDay(-offset + 1)
        val minutes = foregroundMinutes(start, minOf(end, System.currentTimeMillis()))
        out.add(mapOf("date" to fmt.format(start), "minutes" to minutes))
      }
      out
    }
  }

  private fun authorizationStatus(): String {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName,
      )
    }
    return when (mode) {
      AppOpsManager.MODE_ALLOWED -> "granted"
      AppOpsManager.MODE_DEFAULT -> "undetermined" // never explicitly toggled
      else -> "denied"
    }
  }

  /** Sum of foreground time (in whole minutes) across all apps in [start, end). */
  private fun foregroundMinutes(start: Long, end: Long): Long {
    if (end <= start) return 0L
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val stats = usm.queryAndAggregateUsageStats(start, end)
    val totalMs = stats.values.sumOf { it.totalTimeInForeground }
    return totalMs / 60000L
  }

  /** Epoch ms of local midnight, `dayOffset` days from today (0 = today). */
  private fun startOfDay(dayOffset: Int): Long {
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, dayOffset)
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.timeInMillis
  }
}
