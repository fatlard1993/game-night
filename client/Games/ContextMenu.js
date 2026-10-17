import { ContextMenu as LibraryContextMenu, styled } from '@vanilla-bean/components';

const reticleSize = 32; // Hexagonal click indicator size in px, used by augmented-ui for the hex shape

const Reticle = styled.Component`
	position: absolute;
	color: ${({ colors }) => colors.red};

	--aug-border: initial;
	--aug-all-hexangle-up: initial;
	--aug-all-width: ${reticleSize}px;
	--reticle-color: currentColor;
	--reticle-size: calc(var(--aug-all-width) * 0.25);
	--aug-border-bg:
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
	transform-origin: 50% 56%;
	transform: rotateZ(0deg);
	transition:
		transform 0.3s ease-out,
		color 0.4s ease-out;
	background: radial-gradient(circle at 50% 56%, var(--reticle-color) 2px, transparent 2px);

	@starting-style {
		transform: rotateZ(360deg) scale(3);
		color: transparent;
	}
`;

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
				attributes: { 'data-augmented-ui': 'all-hexangle-up' },
				style: {
					left: `${options.x - reticleSize / 2}px`,
					top: `${options.y - reticleSize / 2}px`,
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
