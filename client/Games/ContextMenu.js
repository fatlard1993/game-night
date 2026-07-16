import { styled, Menu, isDescendantOf } from '@vanilla-bean/components';

const itemHeight = 37; // Menu item height in px, matches Menu component's rendered li height
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

export default class ContextMenu extends styled.Popover(
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

		ul {
			overflow: hidden;
		}

		li {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`,
	{ autoOpen: false, sticky: false, maxWidth: 240 },
) {
	static schema = {
		items: {
			set(value) {
				if (!this.menu) this.menu = new Menu({ appendTo: this });

				this.menu.options.items = value.map(item => ({
					...item,
					...(!this.options.sticky && {
						onPointerPress: event => {
							item.onPointerPress(event);

							this.hide();
						},
					}),
				}));

				this.options.maxHeight = (value.length + 1) * itemHeight;
			},
		},
		sticky: {},
		reticle: {},
	};

	build() {
		const keyBinds = ({ key }) => {
			if (this.isOpen && key === 'Escape') this.hide();
		};
		const pointerBinds = ({ target }) => {
			// A target detached mid-event (e.g. a sticky item rebuilt by its own press handler)
			// was inside the menu when clicked, not an outside press
			if (this.isOpen && target.isConnected && !isDescendantOf(target, this.menu.elem)) this.hide();
		};

		document.addEventListener('keyup', keyBinds);
		document.addEventListener('pointerdown', pointerBinds);

		this.addCleanup('contextMenu', () => {
			document.removeEventListener('keyup', keyBinds);
			document.removeEventListener('pointerdown', pointerBinds);
			this.contextPointer?.elem.remove();
		});
	}

	edgeAwarePlacement(options) {
		const { x, y } = options;

		if (this.contextPointer) this.contextPointer.elem.remove();

		// The reticle marks a right-click point; dropdown-style usage (reticle: false) has none
		if (this.options.reticle === false) return super.edgeAwarePlacement(options);

		this.contextPointer = new Reticle({
			appendTo: document.body,
			attributes: { 'data-augmented-ui': 'all-hexangle-up' },
			style: {
				left: `${x - reticleSize / 2}px`,
				top: `${y - reticleSize / 2}px`,
			},
		});

		return super.edgeAwarePlacement(options);
	}

	hide() {
		if (this.contextPointer) this.contextPointer.elem.remove();

		super.hide();
	}
}
