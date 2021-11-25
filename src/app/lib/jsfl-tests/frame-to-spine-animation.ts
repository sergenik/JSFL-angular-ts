// tslint:disable: no-var-keyword
// tslint:disable: prefer-const
// tslint:disable: typedef
// tslint:disable: forin

import { RemoveSpineIntermediateLerp } from './remove-spine-intermediate-lerp';

var STEPPED = 'stepped'; // http://esotericsoftware.com/spine-json-format#Animations
var SINGLE_FRAME = 'single frame'; // flash-cs5_extending
var PLAY_ONCE = 'play once';
var LOOP = 'loop';

var FPS = 1;
var boneLength = 5;
var pathUrl = '';
var skinIndex = 0;
var spineJson;
var spriteSheetLibrary;

var instanceCounter = {};
var spineAnimation;

export class FrameToSpineAnimation {
  constructor() {}

  /**
   *
   * @param animation
   * @param pSpineJson may come empty or populated with animation and skins
   * @param pSpriteSheetLibrary
   */
  public convertHere(animation, pSpineJson, pSpriteSheetLibrary?) {
    console.log('frameToSpineAnimation.convertHere()');
    spineJson = pSpineJson;
    spriteSheetLibrary = pSpriteSheetLibrary;

    var name = '_Player/_Player/Llama Parts/Run'; // 'Run';
    name = '_Player/_Player/Llama Parts/leg1_running';

    // init spineJson
    var rootBoneName = 'root';
    if (!spineJson.skeleton) {
      spineJson.skeleton = { images: pathUrl + 'images' };
    }
    if (!spineJson.bones) {
      spineJson.bones = [{ name: rootBoneName }];
    }
    if (!spineJson.slots) {
      spineJson.slots = [];
    }
    if (!spineJson.skins) {
      spineJson.skins = [];
    }
    if (!spineJson.animations) {
      spineJson.animations = {};
    }

    spineJson.skins.push({ name: 'default', attachments: {} });

    spineAnimation = spineJson.animations[name] = {
      bones: {},
      slots: {},
    };

    // convert animation
    var timelineFrameCount = this.getAnimationFrameCount(animation[name]);
    this.convertAnimation(
      rootBoneName,
      undefined,
      animation[name],
      animation,
      timelineFrameCount,
      timelineFrameCount
    );

    // remove excessive value and log
    console.log(JSON.stringify(spineJson, null, ' '));
    new RemoveSpineIntermediateLerp().removeMiddleLerpInSpine(spineJson);
    console.log(
      '// ------------------------------------------------------- //'
    );
    console.log(JSON.stringify(spineJson, null, ' '));
  }

  private getInstanceCounter(namePath) {
    if (!instanceCounter[namePath]) {
      instanceCounter[namePath] = 1;
    } else {
      instanceCounter[namePath]++;
    }
    var counter = instanceCounter[namePath];
    return counter - 1;
  }

  private getLibraryName(namePath) {
    var name = namePath.split('/').pop();
    return name;
  }

  private getInstanceName(namePath) {
    var counter = this.getInstanceCounter(namePath);
    var name =
      this.getLibraryName(namePath) + (counter === 0 ? '' : '-' + counter);
    return name;
  }

  // ------------------------------------------------------------- //
  /** FIXME: SN - it should be more reliable,
   *    as there could be several same library names in different library folders.
   */
  private isBone(namePath) {
    var name = this.getLibraryName(namePath) + '0000';
    var ifCollectBoneData =
      spriteSheetLibrary && spriteSheetLibrary[name] ? false : true;
    return ifCollectBoneData;
  }

  private getBoneName(instanceName) {
    return instanceName + '-bone';
  }

  private getSlotName(instanceName) {
    return instanceName + '-slot';
  }

  /** bones: [{name: string, parent: string, length: number}]
   *    var boneAnimation or boneTransform: {time?: number, angle?:number}
   *
   * Bone timeline types:
   *
   *    rotate: Keyframes for a bone's rotation.
   *    translate: Keyframes for a bone's X and Y position.
   *    scale: Keyframes for a bone's X and Y scale.
   *    shear: Keyframes for a bone's X and Y shear.
   *
   *    Common bone keyframe attributes:
   *
   *    time: The time in seconds for the keyframe. Assume 0 if omitted.
   *    curve: The interpolation to use between this and the next keyframe.
   *            If the attribute is omitted the curve is linear, if the value is the string "stepped" the curve is stepped,
   *            otherwise the value is an array with 4 elements which define the control points: cx1, cy1, cx2, and cy2.
   *            The X axis unit is frame and the Y axis unit is value.
   *    rotate keyframe attributes:
   *
   *    angle: The bone's rotation relative to the setup pose. Assume 0 if omitted.
   *    translate keyframe attributes:
   *
   *    x: The bone's X position relative to the setup pose. Assume 0 if omitted.
   *    y: The bone's Y position relative to the setup pose. Assume 0 if omitted.
   *    scale keyframe attributes:
   *
   *    x: The bone's X scale relative to the setup pose. Assume 1 if omitted.
   *    y: The bone's Y scale relative to the setup pose. Assume 1 if omitted.
   *    shear keyframe attributes:
   *
   *    x: The bone's X shear relative to the setup pose. Assume 0 if omitted.
   *    y: The bone's Y shear relative to the setup pose. Assume 0 if omitted.
   */
  private getBoneTimeline(boneName, parentBoneName) {
    var transforms = spineAnimation.bones[boneName];
    if (transforms) {
      return transforms;
    }

    // add in bones list
    spineJson.bones.push({
      name: boneName,
      parent: parentBoneName,
      length: boneLength,
    });
    // add in bone animation and return to populate
    transforms = spineAnimation.bones[boneName] = {};
    return transforms;
  }

  /** slots: [{name: string, bone: string, attachment: string}]
   *   var slotAnimation = slot.attachment;
   */
  private getSlotTimeline(slotName, boneName, attachmentName) {
    var slot = spineAnimation.slots[slotName];
    if (slot) {
      return slot.attachment;
    }

    // add in slot list
    spineJson.slots.push({
      name: slotName,
      bone: boneName,
      attachment: attachmentName,
    });

    slot = spineAnimation.slots[slotName] = {
      name: boneName,
      attachment: [],
    };
    // return to populate timeline
    return slot.attachment;
  }

  private getSlotAttachment(slotName, boneName) {
    var slot = spineAnimation.slots[slotName];
    var slotAttachment = slot
      ? spineAnimation.slots[slotName].attachment
      : null;
    if (slotAttachment) {
      return slotAttachment;
    }

    slot = spineAnimation.slots[slotName] = {
      name: boneName,
      bone: boneName,
      attachment: {},
    };

    // return to populate timeline
    return slot.attachment;
  }

  /** var attachments = spineJson.skins[0].attachments; */
  private getSkin(slotName, skinName) {
    var attachments = spineJson.skins[skinIndex].attachments;

    var slot = attachments[slotName];
    if (!slot) {
      slot = attachments[slotName] = {};
    }

    var skin = slot[skinName]; // Texture name
    if (!skin) {
      skin = slot[skinName] = {};
    }

    // return to populate x, y, width, height
    return skin;
  }

  // ------------------------------------------------------------- //
  private convertAnimation(
    parentBoneName,
    parentFrames,
    animation,
    library,
    parentFrameCount,
    timelineFrameCount
  ) {
    var isGraphics = true; // FIXME: SN - should come from json!
    var animationFrameCount = this.getAnimationFrameCount(animation);
    var elements = animation.elements;
    for (var index in animation.elements) {
      var element = animation.elements[index];
      var frames = element.frames;

      var namePath = frames[0].libraryName; // library name with path
      if (!namePath) {
        const a = 1;
        return;
      }

      var instanceName = this.getInstanceName(namePath);

      // i - index-to, but will be replaced by startFrame
      for (var i = 0; i < timelineFrameCount; ) {
        var useParentFrames = parentFrames && isGraphics ? true : false;
        // frameCount
        var frameCount = useParentFrames
          ? parentFrameCount
          : animationFrameCount;
        // iAdjusted - as for movie-clip, graphics loop - we should loop if timeline is shorter than top timeline
        var iAdjusted = i % frameCount;
        // deltaI - to set correct startFrame => time (to fill-in if not up to the end)
        var deltaI = i - iAdjusted;
        var frames1 = useParentFrames ? parentFrames : frames;

        // var indices = this.getIndices(frames1, iAdjusted, timelineFrameCount);
        var indices = this.getIndices(
          frames1,
          iAdjusted,
          frameCount,
          timelineFrameCount
        );

        var index0 = indices[0];
        var startFrame = indices[1]; // index-to
        var duration = indices[2];
        var isEmptyFrame = indices[3];

        var frame1 = isEmptyFrame ? null : frames1[index0];

        var time = (startFrame + deltaI) / FPS;
        if (isEmptyFrame) {
          // a). empty frames:
          var time = (startFrame + deltaI) / FPS;
          // time1 = - add time1 if duration > 1 - FIXME: SN
          this.addAnimateDataWithTimeForEmptyFrames(
            namePath,
            instanceName,
            parentBoneName,
            frame1,
            time
          );
        } else if (!useParentFrames) {
          // b. top clips OR movie-clip children:
          // exact or lerp, oh it seems there will be no interpolation!!!
          // this.addAnimateDataWithTime(frame.transforms);
          var frame1 = frames1[index0]; // frames[index0];
          time = (startFrame + deltaI) / FPS; // frame1.startFrame / FPS;
          this.addFrameData(
            namePath,
            instanceName,
            parentBoneName,
            frame1,
            time
          );
        } else {
          // c). parent and child - Graphics:
          var frame1 = frames1[index0]; // parentFrames[index0];
          time = (startFrame + deltaI) / FPS; // frame1.startFrame / FPS;
          // if there is a case of interpolated parent frames?
          this.doFrom(
            startFrame, // index0,
            duration,
            frame1.firstFrame,
            frame1.loop,
            frames,
            frameCount, // parentFrameCount
            timelineFrameCount
          );
        }

        i += duration;
      }

      // recursive bone addition
      var ifCollectBoneData = this.isBone(namePath);
      if (ifCollectBoneData) {
        var boneName = this.getBoneName(instanceName);
        this.convertAnimation(
          boneName,
          frames,
          library[namePath],
          library,
          animationFrameCount,
          timelineFrameCount
        );
      }
    }
  }

  private doFrom(
    pStartFrame,
    pDuration,
    firstFrame,
    loop,
    frames,
    animationFrameCount,
    timelineFrameCount
  ) {
    var length = pStartFrame + pDuration;
    // i = pStartFrame; // iterate in instance
    // j = firstFrame; // iterate in library item
    for (var i = pStartFrame, j = firstFrame; i < length; ) {
      var indices = this.getIndices(
        frames,
        j,
        animationFrameCount,
        timelineFrameCount
      );
      var index0 = indices[0];
      var startFrame = indices[1];
      var duration = indices[2];
      var isEmptyFrame = indices[3];

      //
      var frame;
      if (!isEmptyFrame) {
        // frame = this.getFrameAt(index0);
      } else {
        // set transform for an empty frame
        // frame = this.addEmptyFrameDataForBone(index0);
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

  /** return ~flat == low index
   *    allElementFrameCount may be greater than elementFrameCount
   */
  private getIndices(
    frames,
    firstFrame,
    allElementFrameCount,
    timelineFrameCount
  ) {
    var length = frames.length;
    var elementFrameCount =
      frames[length - 1].startFrame + frames[length - 1].duration;

    var index = 0;
    var startFrame;
    var duration;
    var isEmptyFrame;

    if (firstFrame < frames[0].startFrame) {
      // empty frames at the beginning
      index = 0;
      startFrame = 0;
      duration = frames[0].startFrame;
      isEmptyFrame = true; // frame should be unshift in the beginning
      //
    } else if (firstFrame >= elementFrameCount) {
      // empty frames at the end
      index = length;
      firstFrame = elementFrameCount;
      duration = allElementFrameCount - firstFrame;
      isEmptyFrame = true; // frame should be pushed in the end
      //
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
        startFrame = frames[index].startFrame;
        duration = frames[index].duration;
        isEmptyFrame = false; // frame should be equal to frame at index or interpolated between index and index + 1
      } else {
        // empty frames between index and index + 1
        startFrame = frames[index].startFrame + frames[index].duration;
        duration =
          (index === frames.length - 1
            ? allElementFrameCount
            : frames[index + 1].startFrame) - startFrame;
        isEmptyFrame = true;
      }
    }

    return [index, startFrame, duration, isEmptyFrame];
  }

  // ------------------------------------------------------------- //
  // ------------------------------------------------------------- //
  private getTimeline(ifCollectBoneData, instanceName, parentBoneName) {
    if (ifCollectBoneData) {
      var boneTimeline = this.getBoneTimeline(
        this.getBoneName(instanceName),
        parentBoneName
      );
      return boneTimeline;
    } else {
      var slotTimeline = this.getSlotTimeline(
        this.getSlotName(instanceName),
        this.getBoneName(instanceName),
        '' // FIXME: SN - instanceName?
      );
      return slotTimeline;
    }
  }

  /**
   * Added optional @param time1 - if duration > 1 - do two times!
   */
  private addAnimateDataWithTimeForEmptyFrames(
    namePath,
    instanceName,
    parentBoneName,
    frame,
    time,
    time1?
  ) {
    var ifCollectBoneData = this.isBone(namePath);
    var timeline = this.getTimeline(
      ifCollectBoneData,
      instanceName,
      parentBoneName
    );
    if (ifCollectBoneData) {
      this.addEmptyFrameDataForBone(timeline, time);
      if (time1) {
        this.addEmptyFrameDataForBone(timeline, time1);
      }
    } else {
      this.addEmptyFrameDataForSlot(
        this.getSlotName(instanceName),
        instanceName,
        frame,
        timeline,
        time
      );
      if (time1) {
        this.addEmptyFrameDataForSlot(
          this.getSlotName(instanceName),
          instanceName,
          frame,
          timeline,
          time1
        );
      }
    }
  }

  private addFrameData(namePath, instanceName, parentBoneName, frame, time) {
    var ifCollectBoneData = this.isBone(namePath);
    var timeline = this.getTimeline(
      ifCollectBoneData,
      instanceName,
      parentBoneName
    );
    if (ifCollectBoneData) {
      this.addFrameDataForBone(frame, timeline, time);
    } else {
      this.addFrameDataForSlot(
        this.getSlotName(instanceName),
        instanceName,
        frame,
        timeline,
        time
      );
    }
  }

  private addFrameDataForSlot(slotName, instanceName, frame, timeline, time) {
    var startFrame = 0;
    var countStr = String(startFrame + 1);
    var attachmentCount = '0000'.substr(0, 4 - countStr.length) + countStr;
    var attachmentName2 = instanceName + attachmentCount;

    // there should be animation.slots
    //    but there are three things: slots, skins, animation.skins
    timeline.push({
      time, // : frame.startFrame / FPS,
      name: attachmentName2,
    });

    var x = 0;
    var y = 0;
    var width = frame.width;
    var height = frame.height;

    var skin = this.getSkin(slotName, attachmentName2);
    skin.x = x;
    skin.y = y;
    skin.width = width;
    skin.height = height;
  }

  private addFrameDataForBone(frame, transforms, time) {
    // bone-data
    this.addAnimateDataWithTime(
      transforms,
      'translate',
      'point',
      time,
      frame.transforms.x,
      -frame.transforms.y
    );
    this.addAnimateDataWithTime(
      transforms,
      'rotate',
      'number',
      time,
      -frame.transforms.angle, // note: degrees && sign: "+" to "-"
      NaN
    );

    this.addAnimateDataWithTime(
      transforms,
      'scale',
      'point',
      time,
      frame.transforms.scaleX,
      frame.transforms.scaleY
    );

    this.addAnimateDataWithTime(
      transforms,
      'shear',
      'point',
      time,
      -frame.transforms.skewY, // note: degrees && sign: "+" to "-" for both x,y && change x with y
      -frame.transforms.skewX
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
  private addEmptyFrameDataForBone(timeline, time) {
    // ifCollectBoneData,
    // startFrame,
    // dataObject /* bone | skin */,
    // time ) {
    this.addAnimateDataWithTime(
      timeline, // transforms,
      'scale',
      'point',
      time,
      0,
      0,
      STEPPED
    );
  }

  private addEmptyFrameDataForSlot(
    slotName,
    instanceName,
    frame,
    timeline,
    time
  ) {}

  /** Add translate, angle */
  private addAnimateDataWithTime(
    transforms,
    paramName,
    type,
    time,
    value1,
    value2,
    curve?
  ) {
    var paramFrame;
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

  /** Get maxFrameCount betweenLayers.
   *  Or may be I should add timelineFrameCount or topAnimationFrameCount - not to count at all.
   */
  private getAnimationFrameCount(animation) {
    var elements = animation.elements;
    var maxFrameCount = 0;

    for (var i in elements) {
      var length = elements[i].frames ? elements[i].frames.length : 0;
      if (length > 0) {
        var frame = elements[i].frames[length - 1];
        maxFrameCount = Math.max(
          maxFrameCount,
          frame.startFrame + frame.duration
        );
      }
    }
    return maxFrameCount;
  }
}
