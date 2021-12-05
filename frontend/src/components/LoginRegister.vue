
<template>
	<q-form @submit="submitForm(formData.email)">

        <q-input v-if="tab=='register'"
			v-model="formData.firstName"
			class="q-mb-md"
			outlined
			label="First Name"
			lazy-rules
		/>

        <q-input v-if="tab=='register'"
			v-model="formData.firstName"
			class="q-mb-md"
			outlined
			label="Last Name"
			lazy-rules
		/>

		<q-input v-if="tab=='register'"
			v-model="formData.email"
			class="q-mb-md"
			outlined
			type="email"
			standout
			label="Email"
			lazy-rules
		>
		<template v-slot:prepend>
          <q-icon name="mail" />
        </template>
		</q-input>

        <q-input v-if="tab=='register'"
			v-model="formData.affiliation"
			class="q-mb-md"
			outlined
			label="Affiliation"
			lazy-rules
		>
		</q-input>

         <q-input v-if="tab=='register'"
			v-model="formData.birthay"
			class="q-mb-md"
			outlined
            type="date"
			hint="Birthday"
			lazy-rules
		>
		</q-input>

        <br>


        <q-input
			v-model="formData.username"
			class="q-mb-md"
			outlined
			label="Username"
			lazy-rules
		/>

		<q-input
			v-model="formData.password"
			class="q-mb-md"
			outlined
			type="password"
			label="Password"
			:rules="[ val => (val.length >= 8 && val.toLowerCase() != 'password')  ||  'Please enter at least 8 characters!']"
			lazy-rules
		>
		</q-input>

		<q-input v-if="tab=='register'"
			v-model="formData.confirmPassword"
			class="q-mb-md"
			outlined
			type="password"
			label="Confirm Password"
			:rules="[ val => (val == formData.password)  ||  'You passwords do not match!']"
			lazy-rules
		/>

		<div class="row">
			<!--<q-btn
				v-if="tab=='login'"
				color="primary"
				label="Edit Account?"
				@click="reset"
			/>-->
			<q-btn
				v-if="tab=='register'"
				color="primary"
				icon="help"
				@click="alert=true"
			/>

			<q-dialog v-model="alert">
				<q-card style="max-width: 800px;width:800px;height:auto; border: 12px solid #b094cfff; background:whitesmoke">
					<q-card-section style="width:100%">
						<div class="row no-wrap items-center;">
							<img
								class="surprised"
								src="/surprised.png"
								style="height:320px; width: auto; text-align: center;margin: auto; margin-top: 30px"
							/>
						</div>

					</q-card-section>
					<q-card-section class="q-pt-none">


					</q-card-section>

					<q-card-actions align="center">
						<div
							class="btnPadding"
							style="padding:20px"
						>
							<q-btn
								class="btn"
								color="primary"
								text-color="white"
								size=20px
								label="Got it!"
								no-caps=""
								@click="alert=false"
								v-close-popup
							/>
						</div>
					</q-card-actions>
				</q-card>
			</q-dialog>

			<a
				href="mailto:support@berri.io"
				target='_blank'
				style="text-decoration: none;margin-left:10px"
			>
				<q-btn
					class="emailButton"
					color="primary"
					icon="mail"
				>
					<q-tooltip
						content-class="bg-white"
						transition-show="scale"
						transition-hide="scale"
					>
						<q-banner
							no-border
							style="margin: -5px; color: black; border: 1px lightgray solid"
						>Send us an email at support@berri.io if you have any issues.</q-banner>
					</q-tooltip>
				</q-btn>
			</a>

			<q-space />
			<q-btn
				class="authButton"
				color="primary"
				type="submit"
				:label="tab"
			>
				<q-popup-proxy>
					<q-banner>
						{{this.message}}
					</q-banner>
				</q-popup-proxy>
			</q-btn>
		</div>
	</q-form>
</template>

<script>
	import { mapActions } from "vuex";

	export default {
		props: ["tab"],

		data() {
			return {
				formData: {
					email: "",
					password: "",
					confirmPassword: ""
				},
				message: "Please fill out the form entirely!",
				alert: false,

			};
		},

		methods: {

			...mapActions("auth", [
				"registerUser",
				"loginUser",
				"resetPassword",
				"signInWithGoogle",
			]),

			reset() {
				this.$emit('clicked', true)
			},


			async submitForm(email) {
				if (this.tab === "login") {
					// login tab
					this.message = "Logging in...";
					await this.loginUser(this.formData);

					if (firebaseAuth.currentUser) {
						if (firebaseAuth.currentUser.emailVerified) {
							this.message = "Logging in..."; // will this hide the message?
						} else {
							this.message = "Please verify your email.";
						}
					} else {
						this.message =
							"Please retype your credentials or register your account.";
					}
				} else {
					// registration tab

					(async (user) => {
						user = await firebaseAuth.fetchSignInMethodsForEmail(email);

						if (user.length === 0) {
							// no such account exists in FireBase, so far

							if (checkInstByEmail(email) || ((await getWhitelist(email)) !== 'invalid')  ) {
								this.registerUser(this.formData);
								this.message = "Please check your email for confirmation. It may take a few minutes–check your spam too!";
							} else {
								this.message = "Invalid school domain or non-allowlisted email.";
							}

						} else {
							// the account exists, but may or may not be verified

							// get the user account by their email
							var findUserByEmail = firebaseFunc.httpsCallable(
								"findUserByEmail"
							);
							let userInfo = await findUserByEmail(email);

							//console.log("user:", userInfo.data);
							////console.log("findUserByEmail(email).uid:", (await findUserByEmail(email)).uid)

							if (userInfo.data !== null) {
								//console.log("email verified?:", userInfo.data.emailVerified);
								if (!userInfo.data.emailVerified) {
									var deleteUser = firebaseFunc.httpsCallable(
										"deleteUser"
									);
									await deleteUser(userInfo.data.uid);
									this.registerUser(this.formData);
									this.message =
										"Please check your email for confirmation. It may take a few minutes–check your spam too!";
									//console.log("deleted and remade account")
								} else {
									this.message =
										"This account is already verified.";
								}
							} else {
								//console.log("You somehow managed to get a user that has signinmethods but no user record. good job.");
							}
						}
					})();
				}
			},
		},
	};
</script>
