package app.homeward

import app.homeward.design.components.Blink
import org.junit.Assert.*
import org.junit.Test

// The "go here" ring: on/off about once a second for 8 seconds, then steady. Steady from the start if animations are off.
class BlinkTest {
    @Test fun onInTheFirstHalfOfEachSecond() {
        assertTrue(Blink.visible(elapsedMillis = 0, animationsOn = true))
        assertTrue(Blink.visible(elapsedMillis = 400, animationsOn = true))
        assertFalse(Blink.visible(elapsedMillis = 600, animationsOn = true))
        assertTrue(Blink.visible(elapsedMillis = 1_100, animationsOn = true))
        assertFalse(Blink.visible(elapsedMillis = 7_700, animationsOn = true))
    }

    @Test fun steadyAfterEightSeconds() {
        assertTrue(Blink.visible(elapsedMillis = 8_600, animationsOn = true))
        assertTrue(Blink.visible(elapsedMillis = 60_000, animationsOn = true))
    }

    @Test fun steadyWhenAnimationsAreOff() = assertTrue(Blink.visible(elapsedMillis = 600, animationsOn = false))
}
