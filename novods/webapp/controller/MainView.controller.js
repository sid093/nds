sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/BusyDialog",
	"sap/m/MessageBox"
], function (Controller, JSONModel, BusyDialog, MessageBox) {
	"use strict";

	var that;
	var oBusyDialog = new BusyDialog({});

	return Controller.extend("novods.novods.controller.MainView", {
		onInit: function () {
			// Set instance
			that = this;

			// Set URL Parameters if any
			var sApplication = jQuery.sap.getUriParameters().get("Application");
			var sDocument = jQuery.sap.getUriParameters().get("Document");
			var sJSONData = jQuery.sap.getUriParameters().get("JSONData");
			var sComment = jQuery.sap.getUriParameters().get("Comment") || "";
			var sRemark = jQuery.sap.getUriParameters().get("Remark") || "Document " + sDocument + " updated.";

			// Required Params
			if (!sApplication || !sDocument || !sJSONData) {
				that.showMessageError("Initial Params required.");
			}
			
			// Check that JSON Data is a json string
			try {
				var sJSON = atob(sJSONData);
				sJSON = that._BadJSONtoGoodJSON(sJSON);
				JSON.parse(sJSON);
			} catch (e) {
				that.showMessageError("JSONData param invalid.");
			}

			var oModelData = {
				"Application": sApplication,
				"Document": sDocument,
				"AuthGroup": "",
				"Remark": sRemark,
				"Comment": sComment,
				"Signatory": "",
				"Password": "",
				"JSONData": sJSONData
			};

			// Set View Model
			var oModel = new JSONModel(oModelData);
			that.getView().setModel(oModel);
			that.getView().bindElement("/");
			that.loadInitData();
		},

		_GoodJSONtoBadJSON: function(sGoodJSON) {
			return sGoodJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '$2: ');	
		},
		
		_BadJSONtoGoodJSON: function(sBadJSON) {
			return sBadJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
		},

		showMessageError: function (sString) {
			MessageBox.error(sString, {
				actions: [MessageBox.Action.CLOSE],
				emphasizedAction: MessageBox.Action.CLOSE,
				onClose: function (sAction) {
					that.redirectToiOS({
						status: false
					});
				}
			});
		},

		showMessageInfo: function (sString) {
			MessageBox.error(sString, {
				actions: [MessageBox.Action.CLOSE],
				emphasizedAction: MessageBox.Action.CLOSE
			});
		},

		redirectToiOS: function (oData) {
			console.log("Redirecting to iOS application with data:" + JSON.stringify(oData));
			if (window.webkit) {
				window.webkit.messageHandlers.jsHandler.postMessage(JSON.stringify(oData));
			}
		},

		loadInitData: function () {
			var oModel = that.getView().getModel();
			var oDigiSignModel = that.getView().getModel("DigiSignModel");
			oBusyDialog.open();
			oDigiSignModel.read("/SignSet('')", {
				success: function (oData, oResponse) {
					oBusyDialog.close();
					oModel.setProperty("/Signatory", oData.Signatory);
					oModel.setProperty("/AuthGroup", oData.AuthGroup);
				},
				error: function (oError) {
					that.showMessageError(oError.statusText + ": " + oError.responseText);
					oBusyDialog.close();
				}
			});
		},

		clearData: function () {
			var oModel = that.getView().getModel();
			oModel.setProperty("/Comment", "");
			oModel.setProperty("/AuthGroup", "");
			oModel.setProperty("/Remark", "");
			oModel.setProperty("/Signatory", "");
			oModel.setProperty("/Password", "");
			oModel.setProperty("/Document", "");
		},

		onPressCancel: function (oEvent) {
			that.clearData();
			that.redirectToiOS({
				status: false
			});
		},

		onPressSave: function (oEvent) {
			var oModel = that.getView().getModel();
			var oDigiSignModel = that.getView().getModel("DigiSignModel");

			// Mandatory check
			if (!oModel.getProperty("/Password")) {
				return;
			}

			var jsonData = {
				"Document": oModel.getProperty("/Document"),
				"AuthGroup": oModel.getProperty("/AuthGroup"),
				"Remark": oModel.getProperty("/Remark"),
				"Comment": oModel.getProperty("/Comment"),
				"Signatory": oModel.getProperty("/Signatory"),
				"Password": oModel.getProperty("/Password"),
				"Application": oModel.getProperty("/Application"),
				"JSONData": oModel.getProperty("/JSONData")
			};

			oBusyDialog.open();

			oDigiSignModel.create("/SignSet", jsonData, {
				success: function (oData, oResponse) {
					oBusyDialog.close();
					that.redirectToiOS({
						status: true,
						id: oData.ID
					});
				},
				error: function (oError) {
					oBusyDialog.close();
					try {
						var sMessage = JSON.parse(oError.responseText).error.message.value;
						that.showMessageInfo(oError.statusText + ": " + sMessage);
					} catch (e) {
						that.showMessageInfo(oError.statusText + ": " + oError.responseText);
					}
				}
			});
		}
	});
});