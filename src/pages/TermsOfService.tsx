import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Condiciones de uso
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Lea atentamente nuestras condiciones de servicio.
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              The use of services provided by <strong>Marketxpres</strong> establishes agreement to these terms. By registering or using our services you agree that you have read and fully understood the following terms of Service and <strong>Marketxpres</strong> will not be held liable for loss in any way for users who have not read the below terms of service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">General</h2>
            <ul className="space-y-2">
              <li>By placing an order with <strong>Marketxpres</strong>, you automatically accept all the below listed terms of service weather you read them or not.</li>
              <li>We reserve the right to change these terms of service without notice. You are expected to read all terms of service before placing any order to insure you are up to date with any changes or any future changes.</li>
              <li>You will only use the <strong>Marketxpres</strong> website in a manner which follows all agreements made with Instagram/Facebook/Twitter/Youtube/Other social media site on their individual Terms of Service page. <strong>Marketxpres</strong> rates are subject to change at any time without notice. The payment/refund policy stays in effect in the case of rate changes. <strong>Marketxpres</strong> does not guarantee a delivery time for any services. We offer our best estimation for when the order will be delivered. This is only an estimation and <strong>Marketxpres</strong> will not refund orders that are processing if you feel they are taking too long. <strong>Marketxpres</strong> tries hard to deliver exactly what is expected from us by our re-sellers. In this case, we reserve the right to change a service type if we deem it necessary to complete an order.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Disclaimer:</h3>
            <p><strong>Marketxpres</strong> will not be responsible for any damages you or your business may suffer.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Liabilities:</h3>
            <p><strong>Marketxpres</strong> is in no way liable for any account suspension or picture deletion done by Instagram or Twitter or Facebook or YouTube or Other Social Media.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Service</h2>
            <ul className="space-y-2">
              <li><strong>Marketxpres</strong> will only be used to promote your Instagram/Twitter/Facebook or Social account and help boost your "Appearance" only.</li>
              <li>We <strong>DO NOT</strong> guarantee your new followers will interact with you, we simply guarantee you to get the followers you pay for.</li>
              <li>We <strong>DO NOT</strong> guarantee <strong>100%</strong> of our accounts will have a profile picture, full bio and uploaded pictures, although we strive to make this the reality for all accounts.</li>
              <li>You will not upload anything into the <strong>Marketxpres</strong> site including nudity or any material that is not accepted or suitable for the Instagram/Twitter/Facebook or Social Media community.</li>
              <li>Private accounts would not a get a refund! Please insure that your account is public before ordering.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Refund Policy</h2>
            <ul className="space-y-2">
              <li>No refunds will be made to your payment method. After a deposit has been completed, there is no way to reverse it. You must use your balance on orders from <strong>Marketxpres</strong>.</li>
              <li>You agree that once you complete a payment, you will not file a dispute or a chargeback against us for any reason.</li>
              <li>If you file a dispute or charge-back against us after a deposit, we reserve the right to terminate all future orders, ban you from our site. We also reserve the right to take away any followers or likes we delivered to your or your clients Instagram/Facebook/Twitter or other social media account.</li>
              <li>Orders placed in <strong>Marketxpres</strong> will not be refunded or canceled after they are placed. You will receive a refund credit to your <strong>Marketxpres</strong> account if the order is non deliverable.</li>
              <li>Misplaced or Private account orders will not qualify for a refund. Be sure to confirm each and every order before placing it.</li>
              <li>Fraudulent activity such as using unauthorized or stolen credit cards will lead to termination of your account. There are no exceptions.</li>
              <li>Please do not use more than one server at the same time for the same page. We cannot give you correct followers/likes number in that case. We will not refund for these orders.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Privacy Policy</h2>
            <p className="mb-4">This is the Cookie Policy for <strong>Marketxpres</strong></p>

            <h3 className="text-xl font-semibold mt-6 mb-3">How We Use Cookies</h3>
            <p>We use cookies for a variety of reasons detailed below. Unfortunately in most cases there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Disabling Cookies</h3>
            <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of the this site. Therefore it is recommended that you do not disable cookies.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">The Cookies We Set</h3>

            <h4 className="text-lg font-semibold mt-4 mb-2">Account related cookies</h4>
            <p>If you create an account with us then we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out however in some cases they may remain afterwards to remember your site preferences when logged out.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Login related cookies</h4>
            <p>We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page. These cookies are typically removed or cleared when you log out to ensure that you can only access restricted features and areas when logged in.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Orders processing related cookies</h4>
            <p>This site offers e-commerce or payment facilities and some cookies are essential to ensure that your order is remembered between pages so that we can process it properly.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Forms related cookies</h4>
            <p>When you submit data to through a form such as those found on contact pages or comment forms cookies may be set to remember your user details for future correspondence.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Site preferences cookies</h4>
            <p>In order to provide you with a great experience on this site we provide the functionality to set your preferences for how this site runs when you use it. In order to remember your preferences we need to set cookies so that this information can be called whenever you interact with a page is affected by your preferences.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Third Party Cookies</h3>
            <p>In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.</p>

            <p className="mt-4">This site uses Google Analytics which is one of the most widespread and trusted analytics solution on the web for helping us to understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.</p>

            <p className="mt-4">For more information on Google Analytics cookies, see the official Google Analytics page.</p>

            <p className="mt-4">We also use social media buttons and/or plugins on this site that allow you to connect with your social network in various ways. For these to work the following social media sites will set cookies through our site which may be used to enhance your profile on their site or contribute to the data they hold for various purposes outlined in their respective privacy policies.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">More Information</h3>
            <p>Hopefully that has clarified things for you and as was previously mentioned if there is something that you aren't sure whether you need or not it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.</p>

            <p className="mt-4">However if you are still looking for more information then you can contact us through one of our preferred contact methods.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
