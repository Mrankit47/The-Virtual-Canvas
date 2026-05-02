// Simulate what the code does
const pizzaUrl = "https://res.cloudinary.com/dutitdlwp/image/upload/v1777643829/TVC%20Assets/Admin%20Artworks/Gallery/Stone%20%28rock%29%20Painting/biqze6g9e0tln9uxnzys.heic";

// getImageUrl logic for cloudinary
let url = pizzaUrl;
if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
        url = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
    }
}

console.log("Transformed URL:", url);

// Now check - does optimizedUrl pass it through?
if (url.includes('cloudinary.com')) {
    console.log("optimizedUrl returns as-is (cloudinary shortcut)");
}

// Check if .heic extension matters
console.log("\nOriginal extension: .heic");
console.log("With f_auto, Cloudinary converts .heic to browser-compatible format automatically");

// Check other HEIC files
const heicUrl2 = "https://res.cloudinary.com/dutitdlwp/image/upload/q_auto/f_auto/v1774760013/IMG20260216225904_a3aiep.heic";
console.log("\nOther HEIC URL (already has f_auto):", heicUrl2);
console.log("This one already has f_auto so it works fine!");
