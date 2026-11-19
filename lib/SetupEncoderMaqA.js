"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/SetupEncoderMaqA.json";

$(document).ready(function() {
	$("#NumeroSAPmaqA, #NumeroSAPmaqAButton, #velocidadeMaqA, #velocidadeMaqAButton, #confMetrosRodadosMaqA, #confMetrosRodadosMaqAButton, #leituraEncoderMaqA, #leituraEncoderMaqAButton, #circuferenciaRoloMaqA, #circuferenciaRoloMaqAButton").prop("disabled", true);

	var urlParameter = getUrlParameter();
	var tokenParam = urlParameter["userToken"];
	var hostParam = urlParameter["hostAddress"];
	if (tokenParam && hostParam) {
		userToken = tokenParam;
		hostAddress = hostParam;
		updateWebpage();
	} else {
		window.location.href = "StartApi.html";
	}
	window.onerror = function(message) {
		if (typeof toastr !== "undefined") {
			toastr.error(message, "Error", { "timeOut": "3000" });
		}
	};
});

function getUrlParameter() {
	var parameter = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(match, key, value) {
		parameter[key] = decodeURIComponent(value);
	});
	return parameter;
}

function updateWebpage() {
	if (document.getElementById('voltar')) {
		document.getElementById('voltar').setAttribute("href", "StartApi.html?userToken=" + encodeURIComponent(userToken) + "&hostAddress=" + encodeURIComponent(hostAddress));
		S7Framework.initAuto("#loading_div", $.init);
	}
}

$.init = function() {
	if (isInitialized) return;
	isInitialized = true;

	S7Framework.readData(URL, "init read data", deployValues);

	$("#metrosRodadosMaqAButton").off("click").on("click", function() {
		var metrosRodados = $.trim($("#metrosRodadosMaqA").val());
		if (!metrosRodados || isNaN(metrosRodados)) {
			alert("Informe um valor numérico válido para metros rodados.");
			return;
		}
		var data = '"DadosCalibracao".metrosRodadosMaqA=' + metrosRodados;
		S7Framework.writeData(URL, data, "METROSRODADOSMAQA", function() {
			$("#metrosRodadosMaqA").val("");
		});
	});

	$("#CalButtonMqA").off("click").on("click", function() {
		var data = '"DadosCalibracao".habilitaCalibracaoMaqA=1';
		S7Framework.writeData(URL, data, "HABILITACALIBRACAOMAQA");
	});

	$("#resetEncButtonMqA").off("click").on("click", function() {
		var data = '"DadosCalibracao".resetEncoderMaqA=1';
		S7Framework.writeData(URL, data, "RESETENCODERMAQA");
	});
};

function deployValues(values) {
	if (values && values.length >= 6) {
		$('#actNumeroSAPmaqA').html(values[0]);
		$('#actVelocidadeMaqA').html(values[1]);
		$('#actMetrosRodadosMaqA').html(values[2]);
		$('#idConfMetrosRodadosMaqA').html(values[3]);
		$('#actLeituraEncoderMaqA').html(values[4]);
		$('#actCircuferenciaRoloMaqA').html(values[5]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}