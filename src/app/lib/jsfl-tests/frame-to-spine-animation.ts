// tslint:disable: no-var-keyword
// tslint:disable: prefer-const
// tslint:disable: typedef
// tslint:disable: forin

var STEPPED = 'stepped'; // http://esotericsoftware.com/spine-json-format#Animations
var SINGLE_FRAME = 'single frame'; // flash-cs5_extending
var PLAY_ONCE = 'play once';
var LOOP = 'loop';
var FPS = 1;

export class FrameToSpineAnimation {
  constructor() {}

  public convertHere(animation) {
    console.log('frameToSpineAnimation.convertHere()');
    var name = '_Player/_Player/Llama Parts/Run'; // 'Run';

    var timelineFrameCount = this.getAnimationFrameCount(animation[name]);
    this.convertAnimation(
      undefined,
      animation[name],
      animation,
      timelineFrameCount,
      timelineFrameCount
    );
  }

  private getInstanceCounter(libraryName) {
    return a;
  }

  // ------------------------------------------------------------- //
  private convertAnimation(
    parentFrames,
    animation,
    library,
    parentFrameCount,
    timelineFrameCount,
    spriteSheetLibrary?
  ) {
    var name0 = '_Player/_Player/Llama Parts/leg1_running';

    // var timelineFrameCount = animation.frameCount;
    var parentFrameCount = a;
    var animationFrameCount = this.getAnimationFrameCount(animation);
    var elements = animation.elements;
    for (var index in animation.elements) {
      var element = animation.elements[index];
      var frames = element.frames;
      var libraryName = frames[0].libraryName;
      var instanceName = this.getInstanceCounter(libraryName);
      var ifCollectBoneData =
        spriteSheetLibrary && spriteSheetLibrary[libraryName] ? true : false;

      // if (!parentFrames) {
      //   this.doFrom(
      //     0,
      //     timelineFrameCount,
      //     0,
      //     LOOP,
      //     ifCollectBoneData,
      //     frames,
      //     animationFrameCount
      //   );
      // } else {
      //   // should we have all parent frames at this point? I think, yes and empty filled with 0 scale
      //   for (var i in parentFrames) {
      //     var frame = parentFrames[i];
      //     // parent data: frame.startFrame, frame.duration
      //     // child data: frame.firstFrame, frame.loop
      //     this.doFrom(
      //       frame.startFrame,
      //       frame.duration,
      //       frame.firstFrame,
      //       frame.loop,
      //       ifCollectBoneData,
      //       frames,
      //       timelineFrameCount
      //     );
      //   }
      // }
      for (var i = 0; i < timelineFrameCount; ) {
        var useParentFrames = parentFrames && isGraphics ? true : false;
        var iAdjusted =
          i % (useParentFrames ? parentFrameCount : animationFrameCount);
        var frames1 = useParentFrames ? parentFrames : frames;

        var indices = this.getIndices(frames1, iAdjusted, timelineFrameCount);
        var index0 = indices[0];
        var duration = indices[1];
        var isEmptyFrame = indices[2];

        if (isEmptyFrame) {
          this.addAnimateDataWithTimeForEmtyFrames(
            i,
            duration,
            instanceName,
            libraryName
          );
        } else if (parentFrames && isGraphics) {
          var frame1 = parentFrames[index0];
          // if there is a case of interpolated parent frames?
          this.doFrom(
            index0,
            duration,
            frame1.firstFrame,
            frame1.loop,
            ifCollectBoneData,
            frames,
            timelineFrameCount
          );
        } else {
          // exact or lerp
          this.addAnimateDataWithTime(frame.transforms);
        }

        i += duration;
      }

      this.convertAnimation(
        frames,
        library[libraryName],
        library,
        animationFrameCount,
        timelineFrameCount,
        spriteSheetLibrary
      );
    }
  }

  private doFrom(
    pStartFrame,
    pDuration,
    firstFrame,
    loop,
    ifCollectBoneData,
    frames,
    timelineFrameCount
  ) {
    var length = pStartFrame + pDuration;
    // i = pStartFrame; // iterate in instance
    // j = firstFrame; // iterate in library item
    for (var i = pStartFrame, j = firstFrame; i < length; ) {
      var indices = this.getIndices(frames, j, timelineFrameCount);
      var index0 = indices[0];
      var duration = indices[1];
      var isEmptyFrame = indices[2];

      //
      var frame;
      if (!isEmptyFrame) {
        // frame = this.getFrameAt(index0);
      } else {
        // set transform for an empty frame
        // frame = this.getTransformForEmptyFrame(index0);
      }
      // this.addBoneOrSkinData(ifCollectBoneData, frame);

      //
      if (
        loop === SINGLE_FRAME ||
        (loop === PLAY_ONCE && j + duration >= timelineFrameCount)
      ) {
        // Already set - return.
        // if (duration > 1) {} // Should be stepped, probably, not? And add one more?
        break;
      }

      //
      i += duration;
      j += duration;

      if (loop === LOOP && j >= timelineFrameCount) {
        j -= timelineFrameCount;
      }
    }
  }

  /** return ~flat == low index */
  private getIndices(frames, firstFrame, timelineFrameCount) {
    var length = frames.length;
    var frameCount =
      frames[length - 1].startFrame + frames[length - 1].duration;
    var index = 0;
    var duration;
    var isEmptyFrame;
    if (firstFrame < frames[0].startFrame) {
      // empty frames at the beginning
      index = -1;
      duration = frames[0].startFrame;
      isEmptyFrame = true; // frame should be unshift in the beginning
      // return [index, duration, isEmptyFrame];
    } else if (
      // empty frames at the end
      firstFrame >= frameCount
    ) {
      index = length;
      duration = timelineFrameCount - frameCount;
      isEmptyFrame = true; // frame should be pushed in the end
      // return [index, duration, isEmptyFrame];
    } else {
      while (
        index < frames.length - 1 &&
        frames[index + 1].startFrame <= firstFrame
      ) {
        index++;
      }

      if (
        frames[index].startFrame <= firstFrame &&
        firstFrame < frames[index].startFrame + frames[index].duration
      ) {
        // frames inside index
        duration = frames[index].duration;
        isEmptyFrame = false; // frame should be equal to frame at index or interpolated between index and index + 1
        // return [index, duration, isEmptyFrame];
      } else {
        // empty frames between index and index + 1
        duration =
          index ===
          (frames.length - 1
            ? timelineFrameCount
            : frames[index + 1].startFrame) -
            index;
        isEmptyFrame = true;

        // index += 1; // frame should be sliced after index
        // we might need another frame if duration > 1, reason: both should have curve = "stepped"
        // return [index, duration, isEmptyFrame];
      }
    }

    // var frame;
    // if (isEmptyFrame) {
    //   frame = {
    //     startFrame: 0,
    //     duration: 1,
    //     transforms: {
    //       scaleX: 0,
    //       scaleY: 0,
    //     },
    //   };
    // }
    return [index, duration, isEmptyFrame];
  }
  // ------------------------------------------------------------- //
  private addFrameData(frame, transforms) {
    // bone-data
    this.addAnimateDataWithTime(
      transforms,
      'translate',
      'point',
      frame.startFrame,
      frame.transforms.x,
      -frame.transforms.y,
      FPS
    );
    this.addAnimateDataWithTime(
      transforms,
      'rotate',
      'number',
      frame.startFrame,
      -frame.transforms.angle, // note: degrees && sign: "+" to "-"
      NaN,
      FPS
    );

    this.addAnimateDataWithTime(
      transforms,
      'scale',
      'point',
      1,
      frame.startFrame,
      frame.transforms.scaleX,
      frame.transforms.scaleY
    );

    this.addAnimateDataWithTime(
      transforms,
      'shear',
      'point',
      frame.startFrame,
      -frame.transforms.skewY, // note: degrees && sign: "+" to "-" for both x,y && change x with y
      -frame.transforms.skewX,
      FPS
    );
  }

  /** it might be exact or lerp */
  private getFrameAt(frames, index) {
    var index1 = 0;
    for (var i in frames) {
      if (index < frames[i]) {
        index1 = parseInt(i, 10);
        break;
      }
    }
  }

  /** Add transforms or sprite for a  */
  private getTransformForEmptyFrame(
    ifCollectBoneData,
    startFrame,
    dataObject /* bone | skin */
  ) {
    if (ifCollectBoneData) {
      this.addAnimateDataWithTime(
        dataObject, // transforms,
        'scale',
        'point',
        startFrame,
        0,
        0,
        FPS,
        STEPPED
      );
    } else {
    }
  }

  /** Add translate, angle */
  private addAnimateDataWithTime(
    transforms,
    paramName,
    type,
    startFrame,
    value1,
    value2,
    fps,
    curve?
  ) {
    var paramFrame;
    var time = startFrame / fps;
    if (curve) {
      if (type === 'point') {
        paramFrame = { time, curve, x: value1, y: value2 };
      } else {
        paramFrame = { time, curve, angle: value1 };
      }
    } else {
      if (type === 'point') {
        paramFrame = { time, x: value1, y: value2 };
      } else {
        paramFrame = { time, angle: value1 };
      }
    }

    if (!transforms[paramName]) {
      transforms[paramName] = [];
    }
    transforms[paramName].push(paramFrame);
    return paramFrame;
  }

  /** Get maxFrameCount betweenLayers. */
  private getLayersMaxFrameCount(elements) {
    var maxFrameCount = 0;

    for (var i in elements) {
      for (var j in elements[i].frames) {
        var frame = elements[i].frames[j];
        maxFrameCount = Math.max(
          maxFrameCount,
          frame.startFrame + frame.duration
        );
      }
    }
    return maxFrameCount;
  }
}
