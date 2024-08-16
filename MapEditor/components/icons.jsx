import React from 'react'

export const Close = ({className='fill-slate-800', size="20"}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" className={className}>
		<path d="M10.5858 12L4.92898 17.6569L6.3432 19.0711L12 13.4143L17.6569 19.0711L19.0711 17.6569L13.4142 12L19.0711 6.34317L17.6569 4.92896L12 10.5858L6.34317 4.92897L4.92896 6.34319L10.5858 12Z" ></path>
	</svg>
)

export const Plus = ({className='fill-slate-800', size="12"}) => (
	<svg width={size} height={size} viewBox="0 0 12 12" className={className}>
		<path d="M7 0H5V5H0V7H5V12H7V7H12V5H7V0Z" ></path>
	</svg>
)

export const MenuDots = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path fillRule="evenodd" clipRule="evenodd" d="M7 13.5C7.82843 13.5 8.5 12.8284 8.5 12C8.5 11.1716 7.82843 10.5 7 10.5C6.17157 10.5 5.5 11.1716 5.5 12C5.5 12.8284 6.17157 13.5 7 13.5ZM13.5 12C13.5 12.8284 12.8284 13.5 12 13.5C11.1716 13.5 10.5 12.8284 10.5 12C10.5 11.1716 11.1716 10.5 12 10.5C12.8284 10.5 13.5 11.1716 13.5 12ZM18.5 12C18.5 12.8284 17.8284 13.5 17 13.5C16.1716 13.5 15.5 12.8284 15.5 12C15.5 11.1716 16.1716 10.5 17 10.5C17.8284 10.5 18.5 11.1716 18.5 12Z"></path>
	</svg>
)

export const ShowAll = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path d="M6.70382 3.4567C7.50536 3.12469 8.4629 3.03403 10 3.00928V5.00952C9.56157 5.01682 9.18622 5.0297 8.85313 5.05243C8.11822 5.10257 7.73618 5.19387 7.46918 5.30446C6.48907 5.71044 5.71037 6.48913 5.3044 7.46924C5.1938 7.73624 5.10251 8.11828 5.05237 8.85319C5.02964 9.18625 5.01676 9.56156 5.00946 9.99994H3.00922C3.03398 8.46291 3.12464 7.5054 3.45664 6.70388C4.0656 5.23371 5.23365 4.06567 6.70382 3.4567Z" ></path><path d="M3.45664 17.2961C3.12463 16.4945 3.03397 15.537 3.00922 13.9999H5.00946C5.01676 14.4384 5.02964 14.8137 5.05237 15.1468C5.10251 15.8817 5.1938 16.2637 5.3044 16.5307C5.71037 17.5108 6.48907 18.2895 7.46918 18.6955C7.73618 18.8061 8.11822 18.8974 8.85313 18.9475C9.18622 18.9703 9.56156 18.9831 10 18.9904V20.9907C8.4629 20.9659 7.50536 20.8753 6.70382 20.5433C5.23365 19.9343 4.0656 18.7662 3.45664 17.2961Z" ></path><path d="M14 20.9907V18.9904C14.4384 18.9831 14.8137 18.9703 15.1467 18.9475C15.8816 18.8974 16.2637 18.8061 16.5307 18.6955C17.5108 18.2895 18.2895 17.5108 18.6954 16.5307C18.806 16.2637 18.8973 15.8817 18.9475 15.1468C18.9702 14.8137 18.9831 14.4384 18.9904 13.9999H20.9906C20.9659 15.537 20.8752 16.4945 20.5432 17.2961C19.9342 18.7662 18.7662 19.9343 17.296 20.5433C16.4945 20.8753 15.537 20.9659 14 20.9907Z" ></path><path d="M20.5432 6.70388C20.8752 7.5054 20.9659 8.46291 20.9906 9.99994H18.9904C18.9831 9.56156 18.9702 9.18625 18.9475 8.85319C18.8973 8.11828 18.806 7.73624 18.6954 7.46924C18.2895 6.48913 17.5108 5.71044 16.5307 5.30446C16.2637 5.19387 15.8816 5.10257 15.1467 5.05243C14.8137 5.02971 14.4384 5.01682 14 5.00952V3.00928C15.537 3.03404 16.4945 3.1247 17.296 3.4567C18.7662 4.06567 19.9342 5.23371 20.5432 6.70388Z" ></path><path d="M13.9999 12C13.9999 13.1046 13.1045 14 11.9999 14C10.8953 14 9.99992 13.1046 9.99992 12C9.99992 10.8954 10.8953 10 11.9999 10C13.1045 10 13.9999 10.8954 13.9999 12Z" ></path>
	</svg>

)

export const ShowOther = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path d="M6.70388 3.4567C7.50542 3.12469 8.46296 3.03403 10.0001 3.00928V5.00952C9.56163 5.01682 9.18628 5.0297 8.85319 5.05243C8.11827 5.10257 7.73624 5.19387 7.46924 5.30446C6.48913 5.71044 5.71043 6.48913 5.30446 7.46924C5.19386 7.73624 5.10257 8.11828 5.05243 8.85319C5.0297 9.18625 5.01682 9.56156 5.00952 9.99994H3.00928C3.03404 8.46291 3.1247 7.5054 3.4567 6.70388C4.06566 5.23371 5.23371 4.06567 6.70388 3.4567Z" ></path><path d="M14.0001 20.9907V18.9904C14.4384 18.9831 14.8137 18.9703 15.1468 18.9475C15.8817 18.8974 16.2637 18.8061 16.5307 18.6955C17.5108 18.2895 18.2895 17.5108 18.6955 16.5307C18.8061 16.2637 18.8974 15.8817 18.9475 15.1468C18.9703 14.8137 18.9831 14.4384 18.9904 13.9999H20.9907C20.9659 15.537 20.8753 16.4945 20.5433 17.2961C19.9343 18.7662 18.7662 19.9343 17.2961 20.5433C16.4946 20.8753 15.5371 20.9659 14.0001 20.9907Z" ></path><path d="M5.63655 16.9493C5.24603 17.3398 5.24603 17.973 5.63655 18.3635C6.02707 18.754 6.66024 18.754 7.05076 18.3635L18.3636 7.05065C18.7541 6.66013 18.7541 6.02696 18.3636 5.63644C17.9731 5.24591 17.3399 5.24591 16.9494 5.63644L5.63655 16.9493Z" ></path>
	</svg>
)


export const Eye = ({className='fill-gray-900'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path fillRule="evenodd" clipRule="evenodd" d="M15.1278 12C15.1278 13.6863 13.7274 15.0533 12 15.0533C10.2726 15.0533 8.8722 13.6863 8.8722 12C8.8722 10.3137 10.2726 8.94664 12 8.94664C13.7274 8.94664 15.1278 10.3137 15.1278 12ZM13.3717 12C13.3717 12.7395 12.7576 13.339 12 13.339C11.2424 13.339 10.6283 12.7395 10.6283 12C10.6283 11.2604 11.2424 10.6609 12 10.6609C12.7576 10.6609 13.3717 11.2604 13.3717 12Z" ></path>
		<path fillRule="evenodd" clipRule="evenodd" d="M12 18C7.90486 18 4.40498 15.512 3 12C4.40498 8.48798 7.90475 6 11.9999 6C16.095 6 19.595 8.48798 21 12C19.595 15.512 16.0951 18 12 18ZM11.9999 7.71429C15.1026 7.71429 17.7877 9.45991 19.0808 12C17.7877 14.5401 15.1027 16.2857 12 16.2857C8.89726 16.2857 6.21206 14.5401 4.91897 12C6.21206 9.45991 8.89715 7.71429 11.9999 7.71429Z" ></path>
	</svg>
)

export const EyeClosed = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path d="M3 12C3.34629 12.8656 3.81984 13.669 4.3982 14.3883L3.1051 15.6814L4.51932 17.0956L5.80754 15.8074C6.60111 16.4553 7.50288 16.9811 8.48252 17.3552L8.01453 19.1018L9.94638 19.6194L10.4142 17.8735C10.9301 17.9567 11.4599 18 12 18C12.5413 18 13.0722 17.9565 13.5892 17.873L14.0572 19.6194L15.989 19.1018L15.5207 17.354C16.4999 16.9796 17.4012 16.4537 18.1944 15.8058L19.4842 17.0956L20.8984 15.6814L19.6034 14.3863C20.181 13.6676 20.654 12.8648 21 12H19.0808C17.7877 14.5401 15.1027 16.2857 12 16.2857C8.89725 16.2857 6.21206 14.5401 4.91897 12H3Z" ></path>
	</svg>
)


export const Line = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path fillRule="evenodd" clipRule="evenodd" d="M6.75146 15.1306V15.1306C6.7516 15.5448 6.41592 15.8807 6.0017 15.8808C5.58749 15.881 5.2516 15.5453 5.25146 15.1311C5.25142 14.9906 5.29183 13.8577 5.72195 12.7308C6.15161 11.6052 7.07875 10.2542 8.93625 10.2542C10.6713 10.2542 11.7208 10.8779 12.6242 11.4218L12.6343 11.4279C13.5029 11.9509 14.2064 12.3744 15.4163 12.3744C15.9048 12.3744 16.2194 12.1925 16.4573 11.9172C16.7183 11.6151 16.9063 11.1726 17.0283 10.6575C17.1484 10.1509 17.1911 9.63239 17.2023 9.23237C17.2078 9.03445 17.2055 8.87034 17.2019 8.75742C17.2001 8.70106 17.198 8.65774 17.1964 8.62967L17.1946 8.59935L17.1942 8.59372C17.1628 8.18088 17.4718 7.82024 17.8847 7.78861C18.2977 7.75696 18.6582 8.06611 18.6898 8.47911L17.942 8.53641C18.6898 8.47911 18.6898 8.47911 18.6898 8.47911L18.69 8.48178L18.6903 8.48614L18.6913 8.4998L18.6941 8.54621C18.6963 8.58534 18.6989 8.64059 18.7011 8.70969C18.7055 8.84767 18.7082 9.042 18.7017 9.27419C18.6888 9.73442 18.6397 10.3629 18.4879 11.0033C18.3382 11.6352 18.0746 12.3396 17.5923 12.8979C17.0869 13.4828 16.3665 13.8744 15.4163 13.8744C13.7881 13.8744 12.7801 13.267 11.9056 12.74C11.8871 12.7289 11.8688 12.7179 11.8505 12.7068C10.993 12.1906 10.2412 11.7542 8.93625 11.7542C8.00391 11.7542 7.46363 12.3742 7.12334 13.2657C6.95675 13.7022 6.86216 14.1544 6.80996 14.5155C6.78413 14.6942 6.76931 14.8461 6.76102 14.9566C6.75321 15.0608 6.75168 15.1221 6.75146 15.1306Z" ></path>
	</svg>
)

export const Lines = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24">
		<path d="M18.5 4L15.5 7.5V19" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.5 4.5V11.2493C9.5 11.4108 9.44074 11.5667 9.33346 11.6874L5.66654 15.8126C5.55926 15.9333 5.5 16.0892 5.5 16.2507V19.5" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 6.5H12.3352C12.4262 6.5 12.5 6.5738 12.5 6.66484V13.5M12.5 13.5H19.5M12.5 13.5L9 18" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path>
	</svg>
)

export const Fill = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}><path fillRule="evenodd" clipRule="evenodd" d="M18.6289 16.4087C18.7672 16.1958 18.7885 15.9274 18.6854 15.6954L14.6854 6.6954C14.5242 6.3327 14.1083 6.15839 13.7367 6.29775L5.73666 9.29775C5.44393 9.40753 5.25 9.68737 5.25 10L5.25 16C5.25 16.4142 5.58578 16.75 6 16.75L18 16.75C18.2539 16.75 18.4905 16.6216 18.6289 16.4087ZM16.8459 15.25L6.75 15.25L6.75 10.5197L13.6017 7.95038L16.8459 15.25Z" ></path></svg>
)

export const Circle = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path fillRule="evenodd" clipRule="evenodd" d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" ></path>
	</svg>
)

export const Circles = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<circle cx="5.52402" cy="14.9928" r="2.97715"  stroke="white" stroke-width="0.5"></circle><circle cx="13.5279" cy="15.4654" r="2.97715"  stroke="white" stroke-width="0.5"></circle><circle cx="18.4928" cy="10.4674" r="2.97715"  stroke="white" stroke-width="0.5"></circle><circle cx="11.5279" cy="10.026" r="2.97715"  stroke="white" stroke-width="0.5"></circle><circle cx="8.48496" cy="7.98301" r="2.97715"  stroke="white" stroke-width="0.5"></circle>
	</svg>
)

export const MultiType = ({className='fill-slate-800'}) => (
	<svg width="20" height="20" viewBox="0 0 24 24" className={className}>
		<path d="M7.5 4H6C4.89543 4 4 4.89543 4 6V7.5H5.5V6C5.5 5.72386 5.72386 5.5 6 5.5H7.5V4Z" ></path><path d="M4 16.5V18C4 19.1046 4.89543 20 6 20H7.5V18.5H6C5.72386 18.5 5.5 18.2761 5.5 18V16.5H4Z" ></path><path d="M4 13.5H5.5V10.5H4V13.5Z" ></path><path d="M10.5 4V5.5H13.5V4H10.5Z" ></path><path d="M16.5 4V5.5H18C18.2761 5.5 18.5 5.72386 18.5 6V7.5H20V6C20 4.89543 19.1046 4 18 4H16.5Z" ></path><path d="M20 10.5H18.5V13.5H20V10.5Z" ></path><path d="M20 16.5H18.5V18C18.5 18.2761 18.2761 18.5 18 18.5H16.5V20H18C19.1046 20 20 19.1046 20 18V16.5Z" ></path><path d="M13.5 20V18.5H10.5V20H13.5Z" ></path><path d="M8.125 10.5C8.125 9.18832 9.18832 8.125 10.5 8.125C11.8117 8.125 12.875 9.18832 12.875 10.5C12.875 11.8117 11.8117 12.875 10.5 12.875C9.18832 12.875 8.125 11.8117 8.125 10.5Z" ></path><path d="M13.5 15.875C12.3809 15.875 11.4426 15.101 11.1912 14.0591C12.6388 13.7796 13.7796 12.6388 14.0591 11.1912C15.101 11.4426 15.875 12.3809 15.875 13.5C15.875 14.8116 14.8116 15.875 13.5 15.875Z" ></path>
	</svg>
)


export const CaretDown = ({className='fill-slate-800'}) => (
	<svg width="12" height="12" viewBox="0 0 12 12"  className={className}>
		<path fillRule="evenodd" clipRule="evenodd" d="M2.64645 4.64645C2.84171 4.45118 3.15829 4.45118 3.35355 4.64645L6 7.29289L8.64645 4.64645C8.84171 4.45118 9.15829 4.45118 9.35355 4.64645C9.54882 4.84171 9.54882 5.15829 9.35355 5.35355L6.35355 8.35355C6.15829 8.54882 5.84171 8.54882 5.64645 8.35355L2.64645 5.35355C2.45118 5.15829 2.45118 4.84171 2.64645 4.64645Z"></path>
	</svg>
)

export const CaretDownSolid = ({ className = "fill-slate-800", size = "12" }) => (
  <svg width={size} height={size} viewBox="0 0 320 512" className={className}>
    <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
  </svg>
);

export const CaretUpSolid = ({ className = "fill-slate-800", size = "12" }) => (
  <svg width={size} height={size} viewBox="0 0 320 512" className={className}>
    <path d="M182.6 137.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l256 0c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z" />
  </svg>
);

export const FolderOpen = ({ className = "fill-slate-800", size = "12" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 576 512">
    <path d="M384 480l48 0c11.4 0 21.9-6 27.6-15.9l112-192c5.8-9.9 5.8-22.1 .1-32.1S555.5 224 544 224l-400 0c-11.4 0-21.9 6-27.6 15.9L48 357.1 48 96c0-8.8 7.2-16 16-16l117.5 0c4.2 0 8.3 1.7 11.3 4.7l26.5 26.5c21 21 49.5 32.8 79.2 32.8L416 144c8.8 0 16 7.2 16 16l0 32 48 0 0-32c0-35.3-28.7-64-64-64L298.5 96c-17 0-33.3-6.7-45.3-18.7L226.7 50.7c-12-12-28.3-18.7-45.3-18.7L64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l23.7 0L384 480z" />
  </svg>
);

export const Trash = ({ className = "fill-slate-800", size = "12" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 448 512">
    <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
  </svg>
);

export const FloppyDisk = ({ className = "fill-slate-800", size = "12" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 448 512">
    <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
  </svg>
);

