package app.homeward.features.safetymap

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.BitmapDrawable

// Draws a small Citizen-style map label: white pill, colored dot, short text (e.g. "R. dos Inválidos · after 11pm").
// Returned as an image so the map can pin it at the zone's center.
object ZoneLabel {
    fun make(resources: Resources, text: String, dotColor: Int): BitmapDrawable {
        val d = resources.displayMetrics.density
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 12 * d; typeface = Typeface.DEFAULT_BOLD; color = 0xFF1B1D22.toInt() }
        val pad = 8 * d; val dot = 8 * d; val gap = 6 * d
        val w = (pad + dot + gap + paint.measureText(text) + pad).toInt()
        val h = (paint.textSize + 2 * pad * 0.75f).toInt()
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt(); setShadowLayer(3 * d, 0f, d, 0x33000000) }
        c.drawRoundRect(RectF(d, d, w - d, h - d), h / 2f, h / 2f, bg)
        c.drawCircle(pad + dot / 2, h / 2f, dot / 2, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = dotColor })
        c.drawText(text, pad + dot + gap, h / 2f - (paint.descent() + paint.ascent()) / 2, paint)
        return BitmapDrawable(resources, bmp)
    }
}
