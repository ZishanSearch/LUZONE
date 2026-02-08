 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index 78d2c13f1da9a18d21d6dc5914ab41fc569abfe8..59d2eeae9a302f45552f84dca66ee73b8176c6f9 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,13 @@
 # LUZONE
-A Image Generater App
+
+LUZONE is a simple image generation UI that lets you upload a target style image and your face image to preview a combined output, along with a persistent history.
+
+## Usage
+
+1. Open `index.html` in a browser.
+2. Upload a target image and a face image.
+3. Click **Generate Image** to preview the output and save it to history.
+
+## Notes
+
+This is a front-end demo experience meant to show the workflow and UI.
 
EOF
)
