// make sure specialToggles is globally accessible (preserve content exactly)
var specialToggles = "";

/***************************************************************************
 * TEXTURE SYSTEM
 ***************************************************************************/
(function () {
    const slider = document.getElementById("slider");
    const output = document.getElementById("output");
    const decBtn = document.getElementById("dec");
    const incBtn = document.getElementById("inc");
    const resetBtn = document.getElementById("reset");

    if (!slider || !output) {
        // elements missing — bail gracefully
        return;
    }

    function smoothScale(level, min, max, exponent = 1.3) {
        const t = Math.pow(level / 11, exponent);
        return min + (max - min) * t;
    }

    function generateCommands(level) {
        const streamingBoost = smoothScale(level, 0, 5.5).toFixed(2);
        const groupBoost = smoothScale(level, 1, 10, 1.3).toFixed(2);
        const mipBiasArray = [6, 4, 3, 2, 1, 0, -2, -4, -6, -8, -10, -12];
        const mipLODBias = mipBiasArray[level];

        return `
r.Streaming.GroupBoost.HugeBuildingTextureFactor=${groupBoost}
r.Streaming.GroupBoost.LargeBuildingTextureFactor=${groupBoost}
r.Streaming.GroupBoost.MediumBuildingTextureFactor=${groupBoost}
r.Streaming.GroupBoost.HugeFoliageTextureFactor=${groupBoost}
r.Streaming.GroupBoost.LargeFoliageTextureFactor=${groupBoost}
r.Streaming.GroupBoost.MediumFoliageTextureFactor=${groupBoost}
r.Streaming.GroupBoost.HugeNpcTextureFactor=${groupBoost}
r.Streaming.GroupBoost.LargeNpcTextureFactor=${groupBoost}
r.Streaming.GroupBoost.MediumNpcTextureFactor=${groupBoost}
r.Streaming.GroupBoost.CommonHLODTextureFactor=${groupBoost}
r.Streaming.GroupBoost.LandscapeHLODTextureFactor=${groupBoost}
r.Streaming.GroupBoost.LargeRocTextureFactor=${groupBoost}
r.Streaming.Boost=${streamingBoost}
r.Streaming.MinBoost=${streamingBoost}
r.Streaming.FullyLoadUsedTextures=1
r.MipMapLODBias=${mipLODBias}
r.Streaming.MipBias=-2
`.trim();
    }

    function updateOutput() {
        const level = +slider.value;
        const txt = generateCommands(level);
        output.textContent = txt;
        try { localStorage.setItem("textureConfig", txt); } catch (e) {}
    }

    slider.addEventListener("input", updateOutput);
    if (decBtn) decBtn.addEventListener("click", () => { slider.value = Math.max(0, +slider.value - 1); updateOutput(); });
    if (incBtn) incBtn.addEventListener("click", () => { slider.value = Math.min(11, +slider.value + 1); updateOutput(); });
    if (resetBtn) resetBtn.addEventListener("click", () => { slider.value = 5; updateOutput(); });

    try {
        const stored = localStorage.getItem("textureConfig");
        if (stored && stored.length) output.textContent = stored;
        else updateOutput();
    } catch (e) { updateOutput(); }
})();

/***************************************************************************
 * SHADOW SYSTEM
 ***************************************************************************/
(function () {
    const shadowOutput = document.getElementById("shadowOutput");
    const shadowSlider = document.getElementById("shadowSlider");
    const shadowDec = document.getElementById("shadowDec");
    const shadowInc = document.getElementById("shadowInc");
    const shadowReset = document.getElementById("shadowReset");
    const shadowModeEl = document.getElementById("shadowMode");
    if (!shadowOutput || !shadowSlider) return;

    let shadowMode = "basic";

    if (shadowDec) shadowDec.onclick = () => { shadowSlider.value = Math.max(0, +shadowSlider.value - 1); updateShadowQuality(); };
    if (shadowInc) shadowInc.onclick = () => { shadowSlider.value = Math.min(11, +shadowSlider.value + 1); updateShadowQuality(); };
    if (shadowReset) shadowReset.onclick = () => { shadowSlider.value = 5; updateShadowQuality(); };

    window.setShadowMode = function (mode) {
        shadowMode = mode;
        if (shadowModeEl) shadowModeEl.innerText = "Current Mode: " + mode.charAt(0).toUpperCase() + mode.slice(1);
        updateShadowQuality();
    };

    window.updateShadowQuality = function () {
        const level = +shadowSlider.value;
        let result = "\n";
        if (level === 0) {
            result += `r.ShadowQuality=0
r.Shadow.MaxResolution=0
r.Shadow.MinResolution=0
r.Shadow.FarShadow=0
r.DistanceFieldShadowing=0`;
            shadowOutput.textContent = result;
            try { localStorage.setItem("shadowConfig", result); } catch (e) {}
            return;
        }

        let baseRes = 256 * Math.pow(2, (level - 1) / 2.5);
        baseRes = Math.round(baseRes / 256) * 256;
        if (baseRes > 8192) baseRes = 8192;

        const shadowQuality = Math.min(5, Math.round(1 + level / 2.5));
        const cascades = Math.min(4, Math.ceil(level / 3));
        const distance = Math.round(20000 * Math.pow(level, 2));
        const pcfSamples = Math.min(64, Math.round(4 + level * 5.4));
        const radius = (0.003 - (level / 11) * 0.002).toFixed(4);
        const radiusFar = (0.006 - (level / 11) * 0.003).toFixed(4);

        if (shadowMode === "advanced") {
            result += `
r.ShadowQuality=${shadowQuality}
r.Shadow.CSM.MaxCascades=${cascades}
r.Shadow.CSM.MaxDistance=${distance}
r.Shadow.FarShadowDistanceOverride=${distance}
r.Shadow.MinResolution=${baseRes / 2}
r.Shadow.MaxResolution=${baseRes}
r.Shadow.PCFMaxSamples=${pcfSamples}
r.Shadow.TexelsPerPixel=${(4 + level / 2).toFixed(1)}
r.ContactShadows=${level >= 3 ? 1 : 0}
r.DistanceFieldShadowing=${level >= 7 ? 1 : 0}`.trim();
        } else {
            result += `
r.ShadowQuality=${shadowQuality}
r.Shadow.MinResolution=${baseRes / 2}
r.Shadow.MaxResolution=${baseRes}
r.Shadow.RadiusThreshold=${radius}
r.Shadow.RadiusThresholdFar=${radiusFar}
r.Shadow.FarShadow=1
r.Shadow.CSM.MaxCascades=${cascades}
r.Shadow.PCFMaxSamples=${pcfSamples}
r.Shadow.TexelsPerPixel=${(4 + level / 2).toFixed(1)}
r.ContactShadows=${level >= 3 ? 1 : 0}
r.DistanceFieldShadowing=${level >= 7 ? 1 : 0}
r.DistanceFieldShadowDistance=${level >= 7 ? 1000000 + level * 40000 : 0}`.trim();
        }
        shadowOutput.textContent = result;
        try { localStorage.setItem("shadowConfig", result); } catch (e) {}
    };

    try {
        const stored = localStorage.getItem("shadowConfig");
        if (stored && stored.length) shadowOutput.textContent = stored;
        else {
            shadowMode = "basic";
            if (shadowModeEl) shadowModeEl.innerText = "Current Mode: Basic";
            updateShadowQuality();
        }
    } catch (e) { shadowMode = "basic"; updateShadowQuality(); }
})();

/***************************************************************************
 * GARBAGE COLLECTION
 ***************************************************************************/
(function () {
    const gcOutput = document.getElementById("gcOutput");
    const gcDec = document.getElementById("gcDec");
    const gcInc = document.getElementById("gcInc");
    const gcReset = document.getElementById("gcReset");
    if (!gcOutput) return;
    const gcSettings = {
        aggressiveness: 5,
        generateCommands() {
            return `
[/Script/Engine.GarbageCollectionSettings]
gc.TimeBetweenPurgingPendingKillObjects=${60 - this.aggressiveness * 5}
gc.NumRetriesBeforeForcingGC=${5 + this.aggressiveness}
gc.MinDesiredObjectsPerSubTask=${20 + this.aggressiveness * 2}
gc.BlueprintClusteringEnabled=True
gc.FlushStreamingOnGC=True
gc.ValidateGCHeap=False
gc.StallCollectionWhileWaiting=False
gc.RandomFrequency=0
gc.MaxObjectsNotConsideredByGC=0
gc.AllowInitialGarbageCollection=True
gc.CollectGarbageEveryFrame=False
gc.ForceGCAtRegularInterval=False
gc.MinGCClusterSize=4
gc.MaxGCClusterSize=64
gc.VerifyUObjectsAreNotFGCObjects=False
gc.DisableAutomaticGC=False`.trim();
        },
        updateOutput() {
            const txt = this.generateCommands();
            gcOutput.textContent = txt;
            try { localStorage.setItem("gcConfig", txt); } catch (e) {}
        }
    };
    if (gcDec) gcDec.addEventListener("click", () => { gcSettings.aggressiveness = Math.max(0, gcSettings.aggressiveness - 1); gcSettings.updateOutput(); });
    if (gcInc) gcInc.addEventListener("click", () => { gcSettings.aggressiveness = Math.min(10, gcSettings.aggressiveness + 1); gcSettings.updateOutput(); });
    if (gcReset) gcReset.addEventListener("click", () => { gcSettings.aggressiveness = 5; gcSettings.updateOutput(); });
    gcSettings.updateOutput();
})();

/***************************************************************************
 * SPECIAL TOGGLES
 ***************************************************************************/
(function () {
    const output = document.getElementById("specialTogglesOutput");
    if (!output) return;
    function updateOutput() {
        output.textContent = specialToggles.trim();
        try { localStorage.setItem("specialTogglesConfig", output.textContent.trim()); } catch (e) {}
    }
    const enableVulkanBtn = document.getElementById("enableVulkanBtn");
    const forceVulkanBtn = document.getElementById("forceVulkanBtn");
    const enableFrameGenBtn = document.getElementById("enableFrameGenBtn");
    const unlockUltraQualityBtn = document.getElementById("unlockUltraQualityBtn");
    const resetSpecialTogglesBtn = document.getElementById("resetSpecialTogglesBtn");
    const addAllBtn = document.getElementById("addAllSpecialTogglesBtn");

    if (enableVulkanBtn) enableVulkanBtn.addEventListener("click", () => {
        specialToggles = `r.Mobile.DeviceEvaluation=3
r.Android.DisableVulkanSM5Support=0
r.Android.DisableVulkanSupport=0`.trim();
        updateOutput();
    });

    if (forceVulkanBtn) forceVulkanBtn.addEventListener("click", () => {
        specialToggles = `r.Mobile.DeviceEvaluation=3
r.Android.DisableOpenGLES31Support=1
r.Android.DisableVulkanSM5Support=0
r.Android.DisableVulkanSupport=0`.trim();
        updateOutput();
    });

    if (enableFrameGenBtn) enableFrameGenBtn.addEventListener("click", () => {
        if (!specialToggles.includes("r.Kuro.AFME.Enabled=1")) specialToggles += "\n" + "r.Kuro.AFME.Enabled=1";
        updateOutput();
    });

    if (unlockUltraQualityBtn) unlockUltraQualityBtn.addEventListener("click", () => {
        specialToggles = `r.PostProcessAAQuality=4
r.imp.SSMbScaleLod0=0.00
r.imp.SSMbScaleLod1=0.00
r.MaterialQualityLevel=2
r.KuroMaterialQualityLevel=2
r.Mobile.HighQualityMaterial=1`.trim();
        updateOutput();
    });

    if (resetSpecialTogglesBtn) resetSpecialTogglesBtn.addEventListener("click", () => {
        specialToggles = "";
        updateOutput();
    });

    if (addAllBtn) addAllBtn.addEventListener("click", () => {
        specialToggles = `r.Mobile.DeviceEvaluation=3
r.Android.DisableVulkanSM5Support=0
r.Android.DisableVulkanSupport=0
r.Android.DisableOpenGLES31Support=1
r.Kuro.AFME.Enabled=1
r.PostProcessAAQuality=4
r.imp.SSMbScaleLod0=0.00
r.imp.SSMbScaleLod1=0.00
r.MaterialQualityLevel=2
r.KuroMaterialQualityLevel=2
r.Mobile.HighQualityMaterial=1`.trim();
        updateOutput();
    });

    try {
        const stored = localStorage.getItem("specialTogglesConfig");
        if (stored) { specialToggles = stored; updateOutput(); }
    } catch (e) {}
})();

/***************************************************************************
 * ENGINE.INI GENERATOR
 ***************************************************************************/
(function () {
    const generateBtn = document.getElementById("generateBtn");
    if (!generateBtn) return;
    generateBtn.addEventListener("click", () => {
        let textureConfig = "", shadowConfig = "", gcConfig = "", specialConfig = "";
        try {
            if (document.getElementById("includeTextureScaling")?.checked)
                textureConfig = localStorage.getItem("textureConfig") || document.getElementById("output")?.textContent || "";
            if (document.getElementById("includeShadows")?.checked)
                shadowConfig = localStorage.getItem("shadowConfig") || document.getElementById("shadowOutput")?.textContent || "";
            if (document.getElementById("includeGarbageCollection")?.checked)
                gcConfig = localStorage.getItem("gcConfig") || document.getElementById("gcOutput")?.textContent || "";
            if (document.getElementById("includeSpecialToggles")?.checked)
                specialConfig = localStorage.getItem("specialTogglesConfig") || document.getElementById("specialTogglesOutput")?.textContent || "";
        } catch (e) {}

        const engineTemplate = `[Core.System]
Paths=../../../Engine/Content
Paths=%GAMEDIR%Content
Paths=../../../Engine/Plugins/ThirdParty/ImpostorBaker/Content
Paths=../../../Engine/Plugins/json2struct/Content
Paths=../../../Engine/Plugins/Experimental/FieldSystemPlugin/Content
; Below are auto-generated settings from WuWa Config Generator`;

        const finalConfig = `${engineTemplate}\n\n${specialConfig}\n\n${textureConfig}\n\n${shadowConfig}\n\n${gcConfig}\n\n; End of Auto-Generated Config`;

        try { localStorage.setItem("generatedConfig", finalConfig); } catch (e) {}
        window.location.href = "generated-engine-ini.html";
    });
})();

/***************************************************************************
 * RESET ALL CONFIGS
 ***************************************************************************/
(function () {
    const resetAllBtn = document.getElementById("resetBtn");
    if (!resetAllBtn) return;
    resetAllBtn.addEventListener("click", () => {
        document.querySelectorAll("input[type='range']").forEach(s => {
            s.value = s.defaultValue ?? s.min ?? 0;
            s.dispatchEvent(new Event('input'));
        });
        ["textureConfig","shadowConfig","generatedConfig","specialTogglesConfig","gcConfig"].forEach(k => localStorage.removeItem(k));
        specialToggles = "";
        const o = document.getElementById("specialTogglesOutput");
        if (o) o.textContent = "";
        document.querySelectorAll("#engineIniContents input[type='checkbox']").forEach(cb => cb.checked = false);
        alert("All configs reset to default values.");
    });
})();

/***************************************************************************
 * NAVBAR LOADER / BG VIDEO
 ***************************************************************************/
(function () {
    if (document.getElementById("navbar")) {
        fetch("components/navbar.html")
            .then(r => r.text()).then(t => { document.getElementById("navbar").innerHTML = t; })
            .catch(() => {});
    }
    const bgVideo = document.getElementById("bg-video");
    if (bgVideo) document.addEventListener("visibilitychange", () => {
        try { document.hidden ? bgVideo.pause() : bgVideo.play(); } catch (e) {}
    });
})();

/***************************************************************************
 * FLOATING CHECKLIST
 ***************************************************************************/
(function () {
    const selectAllBtn = document.getElementById("selectAllBtn");
    const resetChecklistBtn = document.getElementById("resetChecklistBtn");
    const checkboxes = () => document.querySelectorAll("#engineIniContents input[type='checkbox']");
    if (selectAllBtn) selectAllBtn.addEventListener("click", () => { checkboxes().forEach(cb => cb.checked = true); });
    if (resetChecklistBtn) resetChecklistBtn.addEventListener("click", () => { checkboxes().forEach(cb => cb.checked = false); });
})();

/***************************************************************************
 * DRAGGABLE PANEL
 ***************************************************************************/
(function makeDraggable() {
    const el = document.getElementById("engineIniContents");
    if (!el) return;
    let pos1=0,pos2=0,pos3=0,pos4=0;
    el.addEventListener('mousedown', dragMouseDown);
    el.addEventListener('touchstart', dragTouchStart, { passive: false });
    function dragMouseDown(e){e.preventDefault();pos3=e.clientX;pos4=e.clientY;
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDrag);}
    function elementDrag(e){e.preventDefault();pos1=pos3-e.clientX;pos2=pos4-e.clientY;
        pos3=e.clientX;pos4=e.clientY;el.style.left=(el.offsetLeft-pos1)+"px";el.style.top=(el.offsetTop-pos2)+"px";}
    function closeDrag(){document.removeEventListener('mousemove',elementDrag);document.removeEventListener('mouseup',closeDrag);}
    function dragTouchStart(e){e.preventDefault();const t=e.touches[0];pos3=t.clientX;pos4=t.clientY;
        document.addEventListener('touchmove
