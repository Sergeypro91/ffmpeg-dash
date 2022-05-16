const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const { exec, spawn } = require("child_process");
const file = './test-video/Разделение.S01E09.WEB-DL.2160p.mkv';

const getFileInfoComand = `ffprobe -i ${file} -show_streams -print_format json -v error`;

exec(getFileInfoComand, async(error, stdout, stderr) => {
	if (error) {
		console.log(`error: ${error.message}`);
		return;
	}

	if (stderr) {
		console.log(`stderr: ${stderr}`);
		return;
	}

	await detachFileInfo(file, stdout);
});

const detachFileInfo = async (file, fileInfo) => {
	const { streams } = JSON.parse(fileInfo.replace(/stdout: *\\n*\\/g, ""));
	const video = [];
	const audio = [];
	const subtitle = [];

	// console.log('STREAM', streams);

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
	await extractingStreams(file, {video, audio, subtitle});
};

const runComand = (module, args) => {
	const spawnProcess = spawn(module, args);

	spawnProcess.stdout.on("data", data => {
		console.log(`stdout: ${data}`);
	});

	spawnProcess.stderr.on("data", data => {
		console.log(`stderr: ${data}`);
	});

	spawnProcess.on('error', (error) => {
		console.log(`error: ${error.message}`);
	});

	spawnProcess.on("close", code => {
		console.log(`child process exited with code ${code}`);
	});
}

const extractingStreams = async (file, info) => {
	const dirName = path.dirname(file);

	fsExtra.mkdirpSync(`${dirName}/tmp/video`);
	fsExtra.mkdirpSync(`${dirName}/tmp/audio`);
	fsExtra.mkdirpSync(`${dirName}/tmp/subtitle`);

	const buildVideoStream = (source) => {
		const sizes = [
			// {width:3840, bitRate:14000},
			// {width:1920, bitRate:8000},
			{width:1280, bitRate:4000},
			{width:480, bitRate:400}
		];

		sizes.forEach((curr) => {
			if (source.width >= curr.width) {
				const args = [
					`-i`, file,
					`-an`,
					`-sn`,
					`-c:0`, `libx264`,
					`-x264opts`, `keyint=${Math.ceil(info.video[0].fps)}:min-keyint=${Math.ceil(info.video[0].fps)}:no-scenecut`,
					`-b:v`, `${source.bitRate <= curr.bitRate ? source.bitRate : curr.bitRate}k`,
					`-maxrate`, `${source.bitRate <= curr.bitRate ? source.bitRate : curr.bitRate}k`,
					`-bufsize`, `2650k`,
					`-vf`, `scale=${curr.width}:-2`,
					`${dirName}/tmp/video/video-${curr.width}.mp4`
				];

				runComand('ffmpeg', args);
			}
		})
	}

	// buildVideoStream(info.video[0]);


	const buildAudioStream = (source) => {
		source.forEach((audioTrack, id) => {
			const args = [
				'-i', file,
				'-r', '24',
				'-map', `0:${id+1}`,
				'-ac', '2',
				'-ab', `${audioTrack.bitRate || 192}k`,
				'-vn',
				'-sn',
				`${dirName}/tmp/audio/audio-${audioTrack.language}.mp4`
			];

			runComand('ffmpeg', args);
		});
	}

	// buildAudioStream(info.audio);


	const buildSubtitle = (source) => {
		source.forEach((subtitle, id) => {
			const args = [
				'-i', file,
				'-r', '24',
				'-map', `0:${id + info.audio.length + 1}`,
				'-vn',
				'-an',
				`${dirName}/tmp/subtitle/subtitle-${subtitle.title}-${subtitle.language}.vtt`
			];

			runComand('ffmpeg', args);
		});
	}

	buildSubtitle(info.subtitle);

	await fragmentStreams(file);
}

const getDirFiles = (dir, title) => {
	return new Promise((resolve, reject) => {
		try {
			fs.readdir(dir, function (err, files) {
				const filesList = [];

				if (err) {
					return console.log('Unable to scan directory: ' + err);
				}

				files.forEach(function (fileName) {
					if (fileName.includes(title)) {
						filesList.push(fileName)
					}
				});

				resolve(filesList)
			});
		} catch (err) {
			reject(err)
		}

	});
}

const fragmentStreams = async(file) => {
	const dirName = path.dirname(file);
	const videoNames = await getDirFiles(`${dirName}/tmp/video`, 'video-');
	const audioNames = await getDirFiles(`${dirName}/tmp/audio`, 'audio-');

	const fragmentVideo = (source) => {
		source.forEach((video) => {
			const args = [
				`${dirName}/tmp/video/${video}`, `${dirName}/tmp/video/f-${video}`
			];

			runComand('mp4fragment', args);
		});
	}

	const fragmentAudio = (source) => {
		source.forEach((audio) => {
			const args = [
				`${dirName}/tmp/audio/${audio}`, `${dirName}/tmp/audio/f-${audio}`
			];

			runComand('mp4fragment', args);
		});
	}

	// fragmentVideo(videoNames);
	// fragmentAudio(audioNames);

	// await createDashStreams(file);
}

const createDashStreams = async(file) => {
	const dirName = path.dirname(file);
	const videoNames = await getDirFiles(`${dirName}/tmp/video`, 'f-video-');
	const audioNames = await getDirFiles(`${dirName}/tmp/audio`, 'f-audio-');
	const subtitlesNames = await getDirFiles(`${dirName}/tmp/subtitle`, 'subtitle-');

	console.log('STREAM LIST', videoNames, audioNames, subtitlesNames);

	const buildSegment = (dir, source) => {
		return source.reduce((acc, curr) => {
			acc.push(`${dir}/${curr}`);
			return acc;
		}, [])
	}

	const buildSubtitle = (dir, source) => {
		return source.reduce((acc, curr) => {
			const splitCurr = curr.split('-');
			const language = splitCurr[splitCurr.length - 1].replace('.vtt', '');
			acc.push(`[+format=webvtt,+language=${language}]${dir}/${curr}`);
			return acc;
		}, [])
	}

	const args = [
		'-o', `${dirName}/output`,
		'--mpd-name=manifest.mpd',
		...buildSegment(`${dirName}/tmp/video`, videoNames),
		...buildSegment(`${dirName}/tmp/audio`, audioNames),
		...buildSubtitle(`${dirName}/tmp/subtitle`, subtitlesNames)
	]

	// console.log('BUILD DASH', args);


	runComand('mp4dash', args);
}