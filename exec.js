// const fs = require('fs-extra');
const path = require('path');
const { exec } = require("child_process");
const file = './test-video/Разделение.S01E09.WEB-DL.2160p.mkv';

const getFileInfoComand = `ffprobe -i ${file} -show_streams -print_format json -v error`;

exec(getFileInfoComand, (error, stdout, stderr) => {
	if (error) {
		console.log(`error: ${error.message}`);
		return;
	}

	if (stderr) {
		console.log(`stderr: ${stderr}`);
		return;
	}

	detachFileInfo(file, stdout);
});

const detachFileInfo = (file, fileInfo) => {
	const { streams } = JSON.parse(fileInfo.replace(/stdout: *\\n*\\/g, ""));
	const video = [];
	const audio = [];
	const subtitle = [];

	console.log('STREAM', streams);

	streams.map((elem) => {
		const {
			codec_type,
			codec_name,
			r_frame_rate,
			level,
			width,
			height,
			bit_rate,
			tags,
		} = elem;

		if (codec_type === 'video') {
			video.push({
				codec: codec_name,
				fps: r_frame_rate.split('/')[0] / r_frame_rate.split('/')[1],
				width,
				height,
				bitRate: bit_rate,
				level
			});
		}

		if (codec_type === 'audio') {
			audio.push({
				codec: codec_name,
				bitRate: bit_rate,
				language: tags?.language,
				title: tags?.title
			});
		}

		if (codec_type === 'subtitle') {
			subtitle.push({
				codec: codec_name,
				language: tags?.language,
				title: tags?.title
			});
		}
	});

	// console.log('STREAM CONTENT', video, audio, subtitle);
	buildDashStream(file, {video, audio, subtitle});
};

const buildDashStream = (file, info) => {
	const segDuration = 2;
	const preset = 'veryfast';
	const fileName = path.basename(file).replace(`${path.extname(file)}`, "");

	const buildVideoStream = (source) => {
		const sizes = [
			{width:3840, bitRate:14000},
			{width:1920, bitRate:8000},
			{width:1280, bitRate:4000}
		];

		return sizes.reduce((acc, curr, id) => {
			if (source.width >= curr.width) {
				const stream = `-b:v:${id} ${source.bitRate <= curr.bitRate ? source.bitRate : curr.bitRate}k -s:v:${id} ${curr.width}x${Math.ceil(curr.width / (source.width / source.height))} -map 0:v`
				return `${acc} ${stream}`;
			}

			return acc;
		}, '')
	}

	const buildDashStreamComand = `ffmpeg  -r ${info.video[0].fps}  -i ${file}  -map 0:a  -c:a aac  -c:v libx264  ${buildVideoStream(info.video[0])} -preset ${preset}  -x264-params keyint=${segDuration * info.video[0].fps}:scenecut=0  -seg_duration ${segDuration}  -force_key_frames "expr:gte(t,n_forced*2)"  -sc_threshold 0  -profile:v main  -use_template 1  -use_timeline 1  -b_strategy 0  -bf 1  -ar:a:1 22050  -adaptation_sets "id=0,streams=v id=1,streams=a"  -f dash dash/${fileName}.mpd`;

	console.log('COMAND FFMPEG', buildDashStreamComand);

	// exec(buildDashStreamComand, (error, stdout, stderr) => {
	// 	if (error) {
	// 		console.log(`error: ${error.message}`);
	// 		return;
	// 	}
	//
	// 	if (stderr) {
	// 		console.log(`stderr: ${stderr}`);
	// 		return;
	// 	}
	//
	// 	console.log(stdout);
	// });
}