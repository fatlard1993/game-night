import { ContextMenu as LibraryContextMenu, styled } from '@vanilla-bean/components';

const reticleWidth = 32; // Click indicator width in px
// The hexangle's own proportion is width * 0.857142857 = 27.43px; 28 keeps the placement offset on
// whole pixels and is 2% off natural.
const reticleHeight = 28;

/*
 * An upward hexangle — narrow flat top, full width at 72% down, flat bottom — outlined by a 2.5px
 * ring, with a mark where each of three oversized discs crosses it and a dot at the middle.
 *
 * The discs are 8px radius and would merge into a blob without clipping; the ring — a clip-path
 * here — slices them into the three marks.
 *
 * The outer points match the corner cuts of augmented-ui's all-hexangle-up, which this clip-path
 * replaces (top corners 35.7142857% wide by 72.1687836% tall, bottom corners 13.7728802% by
 * 27.8312164%). The discs sit
 * on the midpoints of the top edge and the two lower diagonals, which lands each mark centered on
 * its edge.
 *
 * The inner points come from offsetting each edge 2.5px inward and intersecting the results — done
 * in pixel space, because on a box this much wider than it is tall an even pixel ring is an uneven
 * percentage one. They are traced the opposite way round, so the winding cancels the outer loop and
 * the middle is punched out under the default nonzero fill rule (evenodd support is too young).
 *
 * To adjust the ring width, recompute the inner loop as a set: offset each outer edge inward by the
 * new width in pixel space and re-intersect. The values are not independently tunable.
 */
const Reticle = styled.Component(
	({ colors }) => `
	position: absolute;
	width: ${reticleWidth}px;
	height: ${reticleHeight}px;
	color: ${colors.red};
	/* It lands under the cursor by definition, and it is decoration — it must not eat the click. */
	pointer-events: none;

	--reticle-color: currentColor;
	--reticle-size: calc(${reticleWidth}px * 0.25);

	transform-origin: 50% 56%;
	transform: rotateZ(0deg);
	transition:
		transform 0.3s ease-out,
		color 0.4s ease-out;
	background: radial-gradient(circle at 50% 56%, var(--reticle-color) 2px, transparent 2px);

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at top center, var(--reticle-color) var(--reticle-size), transparent var(--reticle-size)),
			radial-gradient(
				circle at bottom 13.92% right 6.89%,
				var(--reticle-color) var(--reticle-size),
				transparent var(--reticle-size)
			),
			radial-gradient(
				circle at bottom 13.92% left 6.89%,
				var(--reticle-color) var(--reticle-size),
				transparent var(--reticle-size)
			);
		clip-path: polygon(
			35.71% 0%, 64.29% 0%, 100% 72.17%, 86.23% 100%, 13.77% 100%, 0% 72.17%, 35.71% 0%,
			8.98% 72.17%, 18.33% 91.07%, 81.67% 91.07%, 91.02% 72.17%, 59.73% 8.93%, 40.27% 8.93%, 8.98% 72.17%
		);
	}

	@starting-style {
		transform: rotateZ(360deg) scale(3);
		color: transparent;
	}
`,
);

// The library's menu (items, dismissal, keyboard, edge placement), with this app's scale-in, backdrop and reticle
export default class ContextMenu extends styled(
	LibraryContextMenu,
	({ colors }) => `
		overflow: visible;
		transform: scaleY(0);
		transition:
			opacity 0.3s,
			transform 0.1s,
			overlay 0.3s allow-discrete,
			display 0.3s allow-discrete;

		&::backdrop {
			background-color: ${colors.alpha(colors.black, 0)};
			transition:
				display 0.7s allow-discrete,
				overlay 0.7s allow-discrete,
				background-color 0.7s;
		}

		&:popover-open {
			opacity: 1;
			transform: scaleY(1);
			transition:
				overlay 0.6s allow-discrete,
				display 0.6s allow-discrete,
				opacity 0.6s,
				transform 0.6s;

			&::backdrop {
				background-color: ${colors.alpha(colors.black, 0.25)};
			}
		}

		@starting-style {
			&:popover-open {
				opacity: 0;
				transform: scaleY(0);

				&::backdrop {
					background-color: ${colors.alpha(colors.black, 0)};
				}
			}
		}
	`,
) {
	static schema = {
		// false for a dropdown under a button, which has no right-click point to mark
		reticle: {},
	};

	build() {
		super.build();

		this.addCleanup('reticle', () => this.contextPointer?.elem.remove());
	}

	show(options = {}) {
		this.contextPointer?.elem.remove();
		this.contextPointer = null;

		if (this.options.reticle !== false && options.x !== undefined) {
			this.contextPointer = new Reticle({
				appendTo: document.body,
				style: {
					left: `${options.x - reticleWidth / 2}px`,
					top: `${options.y - reticleHeight / 2}px`,
				},
			});
		}

		super.show(options);
	}

	hide() {
		this.contextPointer?.elem.remove();
		this.contextPointer = null;

		super.hide();
	}
}
