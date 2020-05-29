/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"novods/novods/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});