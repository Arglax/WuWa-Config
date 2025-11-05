This config is for **Android** (and hopefully **iOS**) for **WuWa Game Version 2.7**.

Tested on **Poco X6 Pro (`MediaTek 8300 Ultra`)** — provides good graphics quality and smooth performance.  
- Vulkan is forced in this config via `Engine.ini`

Config_1 - Highest quality of all, especially reflections  
Config_2 - Compatibility Config in case Config_1 does not work well  
Config_3 - Reflection and View Distance Quality Reduced, most optimized for mobile config  


*This is being further tested by users in the Discord channel.*  
So far, there are no new issues reported.  

---

### ⚠️ Possible Bugs/Issues:
1. **Black graphics occurrence** when the app is not focused  
   - e.g., when using floating windows or taking a native screenshot  
   *Cause:* Possibly due to forced scalability groups in `DeviceProfiles.ini`.  
   → **Fix:** Delete `DeviceProfiles.ini` if this occurs.

2. **Heating** is expected, but no overheating (>40°C) observed so far.  
   *Update (Oct 15, 2025):* Heating only occurs during low battery + mobile data + charging.

3. **Black screen flickering/blinking** during game loading screens.  
   - scalability groups is most likely the culprit, but in-game is stable.  
   → **Fix:** Same as Issue #1 — delete `DeviceProfiles.ini`.

---

### 🧩 Before Troubleshooting
Please read **`Standard Testing Protocols.md`** first.

---

### 🔧 [Troubleshooting]

If your device crashes, follow these steps:

1. Disable **Vulkan forcing**  
   - Edit your `Engine.ini` or `DeviceProfiles.ini` (see the commented lines).

2. Disable **frame generation**  
   - Set **`r.AFME.Enable = 0`** in your `Engine.ini`.

3. Edit your `DeviceProfiles.ini`  
   - Switch from `"Android_VeryHigh"` to `"Android"` profile.

4. Delete `DeviceProfiles.ini` to test with `Engine.ini` only.

5. Try configs from **Community Configs** or **Old Configs** folders.

6. Join the **Discord server** → Ask in **issues/config-help** channel.

7. If all else fails → **Stop using config files**.

