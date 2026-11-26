package app.homeward

import app.homeward.features.sos.sending.ChannelChooser
import app.homeward.features.sos.sending.SendChannel
import org.junit.Assert.assertEquals
import org.junit.Test

// Checks how the SOS is sent depending on connection.
class ChannelChooserTest {
    @Test fun onlineWithAppUsesPush() = assertEquals(SendChannel.Push, ChannelChooser.choose(true, true))
    @Test fun onlineWithoutAppUsesSms() = assertEquals(SendChannel.Sms, ChannelChooser.choose(true, false))
    @Test fun offlineUsesSmsNoData() = assertEquals(SendChannel.SmsNoData, ChannelChooser.choose(false, true))
}
