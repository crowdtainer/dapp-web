export type Image = {
	sources: {
		avif: string
		webp: string
		png: string
	}
	img: {
		src: string
		w: number
		h: number
	}
};

export const campaignImages = Object.entries(
	import.meta.glob<Image>('$lib/images/projects/**/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp}', {
		query: { enhanced: true },
		import: 'default',
		eager: true
	})
);

export function campaignImagesAt(paths: string[]): [string, Image][] {
	return campaignImages.filter(([stringItem, _]) => {
		return paths.some(path => {
			return stringItem.includes(path);
		}
		);
	});
}