/// <reference path="../pb_data/types.d.ts" />

// PocketBase's own templates link into its dashboard — {APP_URL}/_/#/auth/confirm-verification/{TOKEN}
// and so on. This app has routes for all three, so the links have to come here instead, or a new
// account is told to verify itself in an admin panel it has no account for.
//
// Mail templates belong to the users collection rather than to settings, so this could have been
// three edits in the dashboard. It is a file so that a fresh checkout and every deploy get it too,
// which is the whole reason pb_migrations/ is in git.
//
// Only the links differ from PocketBase's defaults; the wording is its own. Everything is written
// out inside each function rather than shared above them, because a migration runs in an isolated
// runtime and cannot see the outer scope.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_');

    unmarshal(
      {
        verificationTemplate: {
          body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/verify/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p><i>If you didn\'t recently register, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
        resetPasswordTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
        confirmEmailChangeTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/confirm-email/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
      },
      collection,
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_');

    unmarshal(
      {
        verificationTemplate: {
          body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p><i>If you didn\'t recently register, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
        resetPasswordTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
        confirmEmailChangeTemplate: {
          body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
        },
      },
      collection,
    );

    return app.save(collection);
  },
);
