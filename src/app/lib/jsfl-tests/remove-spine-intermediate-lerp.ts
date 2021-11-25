// tslint:disable: no-var-keyword
// tslint:disable: prefer-const
// tslint:disable: typedef
// tslint:disable: forin
// tslint:disable: quotemark

console.log('-> removeSpineIntermediateLerp.jsfl');
var TOLERANCE = 1e-2;

/**
 * Conversion: this ts -> JSFL:
 *      1). private -> function
 *      2). console.log -> console.lo
 *      3). remove this.[function-name]?
 *      4). isMiddleLerp() didn't existed ?? -> replaced with isLerp()
 *      5). What do with optional parameters?
 */

export class RemoveSpineIntermediateLerp {
  // ----------------------------------------------------------------- //
  // ----------------------------------------------------------------- //
  /** FINISHED and SMOKE_TESTED: Remove double frames lerp for transforms.
   *  There are no "islands" as in frames
   *
   * It is
   *  frames: [{transforms: {x, y, scaleX, scaleY ...}}]  is more complicated rather, than
   *  transforms: {position: [{time, x, y}]}
   */
  public removeMiddleLerpInSpine(spine) {
    for (var animationName in spine.animations) {
      for (var boneName in spine.animations[animationName].bones) {
        console.log(
          '  animationName, boneName: ' + animationName + ', ' + boneName
        );
        this.removeMiddleLerpTransformsValues(
          spine.animations[animationName].bones[boneName]
        );
      }
    }
  }

  private removeMiddleLerpTransformsValues(transforms) {
    this.removeMiddleLerpFor(transforms.translate, true, 'x', 'y', 0);
    this.removeMiddleLerpFor(transforms.rotate, false, 'angle', '', 0);
    this.removeMiddleLerpFor(transforms.scale, true, 'x', 'y', 1);
    this.removeMiddleLerpFor(transforms.shear, true, 'x', 'y', 0);

    if (transforms.translate.length === 0) {
      delete transforms.translate;
    }
    if (transforms.rotate.length === 0) {
      delete transforms.rotate;
    }
    if (transforms.scale.length === 0) {
      delete transforms.scale;
    }
    if (transforms.shear.length === 0) {
      delete transforms.shear;
    }
  }

  /** values: [{[time], angle}] */
  private removeMiddleLerpFor(values, hasTwoNames, name1, name2, defaultValue) {
    if (!values) {
      const a = 1;
    }
    for (var index = 0, j = index + 1; index < values.length - 1; index++) {
      var value0 = values[index];
      var value1;
      var value2;
      if (j < values.length) {
        value1 = values[j];
      }
      if (j < values.length - 1) {
        value2 = values[j + 1];
      }

      // console.log(
      //   "    index " +
      //     index +
      //     " at " +
      //     value0.time +
      //     ", " +
      //     value0[name1] +
      //     ", " +
      //     value0[name2]
      // );

      if (!this.isValidTransformAt(values, index, hasTwoNames, name1, name2)) {
        // data error - skip
        j = index + 2;
        continue;
      } else if (
        !this.isValidTransformAt(values, j, hasTwoNames, name1, name2)
      ) {
        // data error - skip
        index = j - 1;
        j = index + 2;
        continue;
      }

      if (index > 0 && value0.time === undefined) {
        // data error - skip
        j = index + 2;
        continue;
      }

      var x0 = value0[name1];
      var x1 = value1[name1];
      var y0 = hasTwoNames ? value0[name2] : undefined;
      var y1 = hasTwoNames ? value1[name2] : undefined;
      var duration1 =
        value1.time -
        (value0.time === undefined && index === 0 ? 0 : value0.time);

      if (j < values.length - 1) {
        var x2 = value2[name1];
        var y2 = hasTwoNames ? value2[name2] : undefined;
        var duration2 = value2.time - value1.time;

        if (
          !this.isValidTransformAt(values, j + 1, hasTwoNames, name1, name2)
        ) {
          index = j;
          j = index + 2;
          continue;
        }

        // console.log(
        //   "    index " + index + " at " + value0.time + ", " + x0 + ", " + y0
        // );

        if (
          this.isLerp(x0, x1, x2, duration1, duration2) &&
          (!hasTwoNames || this.isLerp(y0, y1, y2, duration1, duration2))
        ) {
          // remove found lerp

          var v = values.splice(j, 1);
          // console.log("    remove " + j + " at " + value1.time + ", " + v[0].time);
          index--; // to run for same index again, j stays the same
          continue;
        }
      } else {
        break;
      }

      j = index + 2;
    }

    if (
      values.length === 2 &&
      this.isEqual(values[0][name1], values[1][name1])
    ) {
      values.length = 1;
    }
    // empty
    if (values.length === 1 && this.isEqual(values[0][name1], defaultValue)) {
      values.length = 0;
    }
  }

  /** if name is undefined -  */
  private isValidTransformAt(values, index, hasTwoNames, name1, name2) {
    var v = values[index];

    // item
    if (v === undefined) {
      return false;
    }

    // time
    if (index !== 0 && v.time === undefined) {
      return false;
    }

    // values
    if (v[name1] === undefined) {
      return false;
    }
    if (hasTwoNames && v[name2] === undefined) {
      return false;
    }

    return true;
  }

  // ----------------------------------------------------------------- //
  // ----------------------------------------------------------------- //
  /** UNFINISHED: Remove double frames lerp for frames */
  private removeMiddleLerpFrameValues(frames) {
    this.removeMiddleLerpFrameValueFor(frames, 'x');
    //   removeMiddleLerpFrameValueFor(frames, "y");
    //   removeMiddleLerpFrameValueFor(frames, "scaleX");
    //   removeMiddleLerpFrameValueFor(frames, "scaleY");
    //   removeMiddleLerpFrameValueFor(frames, "angle");
    //   removeMiddleLerpFrameValueFor(frames, "skewX");
    //   removeMiddleLerpFrameValueFor(frames, "skewY");
  }

  /** TEMP moved to transforms. Beware of "islands": frame[i].startFrame + frame[i].duration < frame[i + 1].startFrame */
  private removeMiddleLerpFrameValueFor(frames, name) {
    var durations = [];
    for (var index = 0; index < frames.length; index++) {
      durations[index] = frames.duration;
    }

    for (var index = 0, j = 1; index < frames.length - 1; index++) {
      var frame = frames[index];
      var val0 = frame[name];

      // increment index:
      if (
        val0 === undefined ||
        frame[index].startFrame + durations[index] < frame[j].startFrame // frame[index].duration
      ) {
        j = index + 2; // index will increment and j will be equal to index + 1
        continue;
      }

      var frame1 = frames[j];
      var frame2 = frames[j + 1];
      var val1 = frame1[name];
      var val2 = frame2[name];

      // increment j:
      if (this.isLerp(val0, val1, val2, durations[index], durations[j])) {
        durations[index] += durations[j]; // we can't change
        delete frame1[name];
        // delete durations[j];

        j++;
        index--; // to run loop with same index
      }

      if (j > frames.length - 1) {
        break;
      } else if (
        j === frames.length - 1 ||
        frame[j].startFrame + durations[j] < frame[j + 1].startFrame
      ) {
        // end of timeline or end of "island"
        if (this.isEqual(val0, val1)) {
          delete frame1[name];
        }
        index = j + 1;
      }
    }
  }

  // ----------------------------------------------------------------- //
  // ----------------------------------------------------------------- //
  /** Is middle linear interpolation with TOLERANCE */
  private isLerp(x0, x1, x2, duration1, duration2) {
    var diff = (x1 - x0) / duration1 - (x2 - x1) / duration2;
    if (Math.abs(diff) < TOLERANCE) {
      return true;
    }
    return false;
  }

  private isEqual(x0, x1) {
    if (Math.abs(x1 - x0) < TOLERANCE) {
      return true;
    }
    return false;
  }

  // ----------------------------------------------------------------- //
  // ----------------------------------------------------------------- //
  private roundToFraction2(value) {
    return parseFloat(parseFloat(value).toFixed(2));
  }

  private roundToFraction4(value) {
    return parseFloat(parseFloat(value).toFixed(4));
  }
}
