// Demo viewer functionality for Notion demo pages
(function() {
  function initDemoSection() {
    // Get all demo tabs
    console.log("initDemoSection STARTS");
    const demoTabs = document.querySelectorAll(".demo-tab");
    const demoViewer = document.getElementById("demo-viewer");
    
    if (!demoViewer || demoTabs.length === 0) return;
  
    // Track YouTube player state
    let isYoutubePlaying = true;
    
    // Setup click handler for YouTube pause/play
    function setupYouTubeClick() {
      const iframe = demoViewer.querySelector("#youtube-player");
      if (!iframe) return;
      
      iframe.style.cursor = "pointer";
      iframe.addEventListener("click", function() {
        const iframeSrc = iframe.src;
        if (isYoutubePlaying) {
          // Pause by removing autoplay
          iframe.src = iframeSrc.replace("autoplay=1", "autoplay=0");
        } else {
          // Play by adding autoplay
          iframe.src = iframeSrc.replace("autoplay=0", "autoplay=1");
        }
        isYoutubePlaying = !isYoutubePlaying;
      });
    }
    
    // Media viewer generator function
    function generateMediaViewer(url, type) {
      switch(type) {
        case "youtube":
          const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/\s]+)/);
          const youtubeId = youtubeMatch ? youtubeMatch[1] : "";
          if (youtubeId) {
            const origin = encodeURIComponent(window.location.origin);
            const enhancedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&vq=hd720&fs=0&color=white&origin=${origin}`;
            return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe id="youtube-player" src="${enhancedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; pointer-events: auto;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
          }
          break;
        case "loom":
          const loomMatch = url.match(/loom\.com\/share\/([^?\/\s]+)/);
          const loomId = loomMatch ? loomMatch[1] : "";
          if (loomId) {
            return `<iframe src="https://www.loom.com/embed/${loomId}" frameborder="0" allowfullscreen></iframe>`;
          }
          break;
        case "veed":
          let veedEmbedUrl = url;
          if (!url.includes("/embed/")) {
            const veedMatch = url.match(/veed\.io\/view\/([a-zA-Z0-9_-]+)/);
            if (veedMatch && veedMatch[1]) {
              veedEmbedUrl = `https://www.veed.io/embed/${veedMatch[1]}`;
            } else {
              const genericMatch = url.match(/veed\.io\/([a-zA-Z0-9_-]+)/);
              if (genericMatch && genericMatch[1] && genericMatch[1] !== "view" && genericMatch[1] !== "embed") {
                veedEmbedUrl = `https://www.veed.io/embed/${genericMatch[1]}`;
              }
            }
          }
          return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="${veedEmbedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
        case "image":
          return `<img src="${url}" alt="Demo image">`;
        case "video":
          return `<video controls><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
        default:
          return "<p>Embed your mp4 / YouTube / Loom demo here</p>";
      }
      return "<p>Media not available</p>";
    }
    
    // Add click handler to each tab
    demoTabs.forEach(function(tab) {
      tab.addEventListener("click", function() {
        // Remove active class from all tabs
        demoTabs.forEach(function(t) {
          t.classList.remove("active");
        });
        
        // Add active class to clicked tab
        tab.classList.add("active");
        
        // Get media data from tab
        const mediaUrl = tab.getAttribute("data-media-url");
        const mediaType = tab.getAttribute("data-media-type");
        
        // Update viewer content
        if (mediaUrl && mediaType) {
          demoViewer.innerHTML = generateMediaViewer(mediaUrl, mediaType);
          // Reset YouTube state and setup click handler if YouTube video
          if (mediaType === "youtube") {
            isYoutubePlaying = true;
            setTimeout(setupYouTubeClick, 100);
          }
        } else {
          demoViewer.innerHTML = "<p>Embed your mp4 / YouTube / Loom demo here</p>";
        }
      });
    });
    
    // Setup YouTube click handler for initial load
    if (demoViewer.querySelector("#youtube-player")) {
      setTimeout(setupYouTubeClick, 100);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDemoSection);
  } else {
    // DOM already loaded, initialize immediately
    initDemoSection();
  }
})();
