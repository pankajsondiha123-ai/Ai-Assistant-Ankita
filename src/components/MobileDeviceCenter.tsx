import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Battery,
  BatteryCharging,
  Flashlight,
  FlashlightOff,
  Vibrate,
  MapPin,
  Phone,
  MessageSquare,
  Camera,
  Bell,
  Download,
  X,
  ExternalLink,
  Wifi,
  Copy,
  Check,
  Navigation,
  User,
  Plus
} from 'lucide-react';
import {
  getBatteryTelemetry,
  toggleTorch,
  getTorchStatus,
  vibrateDevice,
  getDeviceLocation,
  dialPhoneNumber,
  sendSmsMessage,
  sendWhatsAppMessage,
  triggerNotification,
  getNetworkStatus,
  BatteryInfo,
  LocationCoordinates,
} from '../utils/mobileDevice';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface MobileDeviceCenterProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstalledApp?: () => void;
}

export const MobileDeviceCenter: React.FC<MobileDeviceCenterProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalledApp,
}) => {
  const [battery, setBattery] = useState<BatteryInfo>({
    supported: false,
    level: 88,
    charging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
  });
  const [torchOn, setTorchOn] = useState(false);
  const [torchMsg, setTorchMsg] = useState('');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsText, setSmsText] = useState('');
  const [network, setNetwork] = useState(getNetworkStatus());
  const [copied, setCopied] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  // Phone Contacts Directory state
  const [contacts, setContacts] = useState<Array<{ name: string; number: string; tag: string }>>(() => {
    try {
      const saved = localStorage.getItem('ankita_phone_contacts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { name: 'आपातकालीन (Police)', number: '112', tag: 'Emergency' },
      { name: 'एम्बुलेंस (Ambulance)', number: '108', tag: 'Medical' },
      { name: 'माँ (Mom)', number: '9876543210', tag: 'Family' },
      { name: 'पापा (Dad)', number: '9876543211', tag: 'Family' },
      { name: 'ऑफिस (Work)', number: '9876543212', tag: 'Work' },
    ];
  });
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getBatteryTelemetry().then(setBattery);
      setTorchOn(getTorchStatus());
      setNetwork(getNetworkStatus());
    }
  }, [isOpen]);

  const handleToggleTorch = async () => {
    playBeep(1200, 0.04);
    const res = await toggleTorch();
    setTorchOn(res.state);
    setTorchMsg(res.message);
    setTimeout(() => setTorchMsg(''), 3000);
  };

  const handleVibrate = () => {
    playConfirm();
    vibrateDevice([150, 80, 150]);
  };

  const handleGetLocation = async () => {
    playBeep(1000, 0.04);
    setLocationLoading(true);
    try {
      const loc = await getDeviceLocation();
      setLocation(loc);
      playConfirm();
    } catch {
      playAlert();
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDial = () => {
    if (!phoneNumber.trim()) return;
    playConfirm();
    dialPhoneNumber(phoneNumber);
  };

  const handleSendWhatsApp = () => {
    playConfirm();
    sendWhatsAppMessage(phoneNumber, smsText || 'नमस्ते! यह संदेश अंकित AI असिस्टेंट द्वारा भेजा गया है।');
  };

  const handleSendSms = () => {
    playConfirm();
    sendSmsMessage(phoneNumber, smsText || 'नमस्ते!');
  };

  const handleSendNotification = async () => {
    playConfirm();
    const sent = await triggerNotification('अंकित AI — मोबाइल सूचना', {
      body: 'आपका मोबाइल असिस्टेंट पूर्णतः सक्रिय और कनेक्टेड है!',
    });
    setNotifSent(sent);
    setTimeout(() => setNotifSent(false), 3000);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      playConfirm();
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstalledApp?.();
      }
    } else {
      playAlert();
      alert('ऐप इंस्टॉल करने के लिए ब्राउज़र मेनू (तीन बिंदु) पर जाकर "Add to Home screen" या "Install" चुनें।');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-2xl bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <Smartphone className="w-5 h-5 text-[#00ff88] animate-pulse" />
            <div>
              <span className="font-orbitron font-bold tracking-wider text-sm text-white">
                MOBILE COMMAND CENTER
              </span>
              <span className="text-[10px] text-[#00ff88] ml-2 font-mono">
                // सम्पूर्ण मोबाइल एक्सेस
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              playBeep(700, 0.04);
              onClose();
            }}
            className="text-[#00b4d8] hover:text-[#00f0ff] p-1.5 rounded-lg hover:bg-[#00f0ff]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-mono text-[#8ffcff]">
          {/* Top Quick Device Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Battery Tile */}
            <div className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
              <div className="flex items-center justify-between text-[#00b4d8]">
                <span className="text-[11px] font-bold">BATTERY</span>
                {battery.charging ? (
                  <BatteryCharging className="w-4 h-4 text-[#00ff88] animate-bounce" />
                ) : (
                  <Battery className="w-4 h-4 text-[#00f0ff]" />
                )}
              </div>
              <div className="text-xl font-orbitron font-extrabold text-white">
                {battery.level}%
              </div>
              <div className="text-[10px] text-[#00ff88]">
                {battery.charging ? 'चार्जिंग चालू' : 'बैटरी सामान्य'}
              </div>
            </div>

            {/* Flashlight Tile */}
            <button
              onClick={handleToggleTorch}
              className={`p-3.5 rounded-xl border text-left transition-all space-y-2 ${
                torchOn
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                  : 'bg-[#001424] border-[#00f0ff]/25 text-[#00b4d8] hover:border-[#00f0ff]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">FLASHLIGHT</span>
                {torchOn ? (
                  <Flashlight className="w-4 h-4 text-yellow-300" />
                ) : (
                  <FlashlightOff className="w-4 h-4 text-[#00b4d8]" />
                )}
              </div>
              <div className="text-lg font-orbitron font-bold text-white">
                {torchOn ? 'ON' : 'OFF'}
              </div>
              <div className="text-[10px] text-yellow-300">
                {torchOn ? 'टॉर्च चालू है' : 'क्लिक कर जलाएं'}
              </div>
            </button>

            {/* Haptic Vibrate Tile */}
            <button
              onClick={handleVibrate}
              className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/25 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 text-left transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-[#00b4d8]">
                <span className="text-[11px] font-bold">VIBRATION</span>
                <Vibrate className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div className="text-sm font-orbitron font-bold text-white">
                HAPTIC
              </div>
              <div className="text-[10px] text-[#00b4d8]">
                कंपन टेस्ट करें
              </div>
            </button>

            {/* Network Tile */}
            <div className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
              <div className="flex items-center justify-between text-[#00b4d8]">
                <span className="text-[11px] font-bold">NETWORK</span>
                <Wifi className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div className="text-sm font-orbitron font-bold text-white">
                {network.effectiveType}
              </div>
              <div className="text-[10px] text-[#00ff88]">
                {network.downlink}
              </div>
            </div>
          </div>

          {torchMsg && (
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs text-center animate-pulse font-mono">
              {torchMsg}
            </div>
          )}

          {/* GPS Live Location Card */}
          <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-3">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
              <div className="flex items-center gap-2 text-[#00f0ff] font-orbitron font-bold text-xs">
                <MapPin className="w-4 h-4 text-[#00ff88]" />
                <span>DEVICE GPS / लोकेशन ट्रैकर</span>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="px-3 py-1 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/30 transition-all text-xs font-mono"
              >
                {locationLoading ? 'स्कैनिंग...' : 'लाइव लोकेशन पाएं'}
              </button>
            </div>

            {location ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="text-white font-semibold">
                    अक्षांश (Lat): {location.latitude.toFixed(5)}, देशांतर (Lon): {location.longitude.toFixed(5)}
                  </div>
                  <div className="text-[11px] text-[#00b4d8]">
                    सटीकता: ±{Math.round(location.accuracy)} मीटर // GPS सिंक्रोनाइज़्ड
                  </div>
                </div>
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 w-fit"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>गूगल मैप्स पर देखें</span>
                </a>
              </div>
            ) : (
              <div className="text-[11px] text-[#0077b6]">
                "लाइव लोकेशन पाएं" पर क्लिक करें ताकि अंकित आपके मोबाइल का सटीक स्थान ढूंढ सके।
              </div>
            )}
          </div>

          {/* Quick Phone Call & Messaging Hub */}
          <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-3">
            <div className="flex items-center gap-2 text-[#00f0ff] font-orbitron font-bold text-xs border-b border-[#00f0ff]/20 pb-2">
              <Phone className="w-4 h-4 text-[#00ff88]" />
              <span>DIRECT PHONE DIALER & CONTACTS // सीधे कॉल व संपर्क</span>
            </div>

            {/* Quick Contacts Directory Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#00b4d8] font-mono">
                <span>त्वरित संपर्क (Quick Contacts):</span>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="text-[#00ff88] hover:underline flex items-center gap-0.5 text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddContact ? 'बंद करें' : 'नया संपर्क जोड़ें'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {contacts.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      playBeep(1100, 0.03);
                      setPhoneNumber(c.number);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-sans transition-all flex items-center gap-1.5 ${
                      phoneNumber === c.number
                        ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]'
                        : 'bg-[#001020] border-[#00f0ff]/20 text-cyan-200 hover:border-[#00f0ff]'
                    }`}
                  >
                    <User className="w-3 h-3 text-[#00f0ff]" />
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({c.number})</span>
                  </button>
                ))}
              </div>

              {showAddContact && (
                <div className="p-2.5 rounded-lg bg-[#000d1a] border border-[#00ff88]/30 flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="नाम (Name)"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#001424] border border-[#00f0ff]/30 text-white text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="फ़ोन नंबर (Phone)"
                    value={newContactNumber}
                    onChange={(e) => setNewContactNumber(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#001424] border border-[#00f0ff]/30 text-white text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      if (!newContactName.trim() || !newContactNumber.trim()) return;
                      playConfirm();
                      const updated = [...contacts, { name: newContactName.trim(), number: newContactNumber.trim(), tag: 'Custom' }];
                      setContacts(updated);
                      try { localStorage.setItem('ankita_phone_contacts', JSON.stringify(updated)); } catch {}
                      setNewContactName('');
                      setNewContactNumber('');
                      setShowAddContact(false);
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-500 text-black font-bold text-xs shrink-0"
                  >
                    सहेजें
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#00b4d8] mb-1 font-mono">
                  फ़ोन नंबर या संपर्क (Phone Number):
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="उदा. 9876543210 या 112"
                  className="w-full px-3 py-2 rounded-lg bg-[#000e1a] border border-[#00f0ff]/30 text-white font-mono text-xs focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#00b4d8] mb-1 font-mono">
                  मैसेज संदेश (Message Text):
                </label>
                <input
                  type="text"
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="उदा. मैं 5 मिनट में पहुंच रहा हूँ..."
                  className="w-full px-3 py-2 rounded-lg bg-[#000e1a] border border-[#00f0ff]/30 text-white font-mono text-xs focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleDial}
                disabled={!phoneNumber.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>कॉल लगाएं (Dial Call)</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-orbitron text-xs font-bold flex items-center gap-2 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>व्हाट्सएप भेजें (WhatsApp)</span>
              </button>

              <button
                onClick={handleSendSms}
                disabled={!phoneNumber.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-orbitron text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>एसएमएस भेजें (SMS)</span>
              </button>
            </div>
          </div>

          {/* Push Notification & PWA Install */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* System Notification */}
            <div className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Bell className="w-4 h-4 text-[#00f0ff]" />
                  <span>सिस्टम नोटिफिकेशन (Alerts)</span>
                </div>
                <div className="text-[11px] text-[#00b4d8]">
                  अंकित को मोबाइल नोटिफिकेशन भेजने की अनुमति दें।
                </div>
              </div>
              <button
                onClick={handleSendNotification}
                className="w-full mt-2 py-2 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 font-orbitron text-xs tracking-wider transition-all"
              >
                {notifSent ? 'सूचना भेजी गई!' : 'नोटिफिकेशन टेस्ट करें'}
              </button>
            </div>

            {/* PWA App Install */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#001f3f] to-[#001020] border border-[#00ff88]/40 space-y-2 flex flex-col justify-between shadow-[0_0_20px_rgba(0,255,136,0.15)]">
              <div>
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Download className="w-4 h-4 text-[#00ff88]" />
                  <span>मोबाइल ऐप की तरह इंस्टॉल करें (PWA)</span>
                </div>
                <div className="text-[11px] text-emerald-200">
                  फोन की होम स्क्रीन पर जोड़ें ताकि यह 100% असली ऐप की तरह खुले।
                </div>
              </div>
              <button
                onClick={handleInstallApp}
                className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-[#00f0ff] text-black font-orbitron font-bold text-xs tracking-wider hover:opacity-95 shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>फोन में ऐप इंस्टॉल करें</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
