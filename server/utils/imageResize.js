// Cap stored cover images at a sane size so the library grid stays light. Uses the ImageMagick
// CLI (already a common system tool) via stdin/stdout, no temp files, no npm dependency.
// Returns the original buffer if magick is missing or the resize doesn't help, so uploads never
// fail on account of image processing.

const MAGICK_FORMAT = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WEBP' };

// Below this, a cover is already small enough that resizing buys nothing
const SKIP_UNDER_BYTES = 250_000;

export const downscaleImage = async (buffer, contentType, maxEdge = 800) => {
	const format = MAGICK_FORMAT[contentType];

	if (!format || buffer.length <= SKIP_UNDER_BYTES) return buffer;

	try {
		const quality = format === 'PNG' ? '90' : '82';
		const proc = Bun.spawn(
			['magick', '-', '-resize', `${maxEdge}x${maxEdge}>`, '-strip', '-quality', quality, `${format}:-`],
			{
				stdin: buffer,
				stdout: 'pipe',
				stderr: 'ignore',
			},
		);

		const out = Buffer.from(await new Response(proc.stdout).arrayBuffer());

		await proc.exited;

		// Keep the result only if it worked and actually shrank the file
		if (proc.exitCode === 0 && out.length > 0 && out.length < buffer.length) return out;
	} catch {
		// magick not installed / spawn failed, fall through to the original
	}

	return buffer;
};
