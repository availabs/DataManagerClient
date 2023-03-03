import {
  simpleCreateNewDamaSource,
  simpleUpdateExistingDamaSource,
} from "../../../utils/api";

async function main(createNew, ctx) {
  console.log(ctx);
  const {
    actions: {
      updateDamaSourceId,
      setPublishStatusToInProgress,
      setPublishStatusToPublished,
      setPublishStatusToError,
      updatePublishErrMsg,
    },
  } = ctx;

  try {
    ctx.dispatch(setPublishStatusToInProgress());

    if (createNew) {
      const id = await simpleCreateNewDamaSource(ctx);

      ctx.dispatch(updateDamaSourceId(id));
    } else {
      await simpleUpdateExistingDamaSource(ctx);
    }

    ctx.dispatch(setPublishStatusToPublished());
  } catch (err) {
    ctx.dispatch(setPublishStatusToError());
    ctx.dispatch(updatePublishErrMsg(err.message));
    console.error("==>", err);
  }
}

export const createNewDamaSource = main.bind(null, true);
export const updateExistingDamaSource = main.bind(null, false);
